const isWhatsappLink = (link = '') => link.indexOf('https://web.whatsapp.com/send') === 0

const _waitForTabCompleted = function(tab) {
  return new Promise((resolve, reject) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (info.status === 'complete' && tabId === tab.id) {
        // console.log('tab update completed', tabId, info)
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
        return
      }
    })
  })
}

const processWhatsappLink = async (link, onUpdateStatusDetail) => {
  return new Promise((resolve, reject) => {
    if (!isWhatsappLink(link)) {
      reject('Invalid whatsapp link: ' + link)
      return
    }

    // create the tab
    chrome.tabs.create({ url: link, active: true }, async tab => {
      // check tab open errors
      if (chrome.runtime.lastError) {
        console.log('Error opening tab', chrome.runtime.lastError)
        reject(chrome.runtime.lastError)
        return
      }

      // open a connection channel
      try {
        await _waitForTabCompleted(tab)
      } catch (error) {
        reject('Tab did not open correctly' + (error ? (error.message || error) : ''))
        return
      }

      const channel = chrome.tabs.connect(tab.id, { name: 'channel-whatsapp-send' })

      // check channel open error
      if (chrome.runtime.lastError) {
        console.log('Error opening channel', chrome.runtime.lastError)
        reject(chrome.runtime.lastError)
        return
      }

      // send first start message
      channel.postMessage({ type: 'start-whatsapp-send' })
      if (chrome.runtime.lastError) {
        console.log('Error sending message \'start-whatsapp-send\'', chrome.runtime.lastError)
        reject(chrome.runtime.lastError)
        return
      }

      // message sent correctly, update status to IN_PROGRESS
      onUpdateStatusDetail('IN_PROGRESS')

      const onDisconnectHandler = channel => {
        console.log('Connection finished abruptly', channel, chrome.runtime.lastError)
        onUpdateStatusDetail('UNEXPECTED_ABORT')
        reject('Whatsapp tab closed unexpectedly')
      }

      // abort/disconnect listener
      channel.onDisconnect.addListener(onDisconnectHandler)

      // listen for tab content script responses
      channel.onMessage.addListener(message => {
        const { type, data } = message
        if (type !== 'update-link') {
          console.error('Unexpected tab response message', message)
          return
        }

        // 'update-link' message
        const { status } = data
        console.log('Updating link status', data)
        onUpdateStatusDetail(status)

        const isFinishStatus = status.indexOf('ABORT') >= 0 || status === 'SENT' || status === 'SENT_RECEIVED'
        if (isFinishStatus) {
          console.log('Finish status', status)
          channel.onDisconnect.removeListener(onDisconnectHandler)
          chrome.tabs.remove(tab.id)

          // check if finish success or error
          if (status.indexOf('ABORT') >= 0) {
            reject(`Send message process aborted: '${status}'`)
            return
          }
          resolve()
        }
      })
    })
  })
}

class LinkJob {
  state = {
    result: null,
    statusDetail: null,
    error: null,
  }

  constructor(link, index, onStatusUpdate) {
    this.url = link
    this.index = index
    this.onStatusUpdate = onStatusUpdate
  }

  setState = state => {
    console.log(`[LinkJob] url '${this.url}' state change `, this.state, ' -> ', state)
    Object.assign(this.state, state)
    if (typeof this.onStatusUpdate !== 'function') {
      console.error('No onStatusUpdate method defined! ', this)
      return
    }
    this.onStatusUpdate(state)
  }

  onUpdateStatusDetail = statusDetail => {
    this.setState({ statusDetail })
  }

  process = async () => {
    this.startTimestamp = Date.now()
    try {
      await processWhatsappLink(this.url, this.onUpdateStatusDetail)
      this.endTimestamp = Date.now()
      this.setState({ result: 'SUCCESS' })
    } catch (error) {
      this.endTimestamp = Date.now()
      this.setState({
        result: 'ERROR',
        error: error ? (error.message || error) : '',
      })
      throw error
    }
  }
}

class LinksQueue {
  state = {
    // true after it has been started manually.
    started: false,
    // process is running (ie. _run() is active). Opposite would be "asleep"
    running: false,
    // process finished all jobs.
    finished: false,
  }

  constructor(links = []) {
    this.jobQueue = links.map((link, i) => new LinkJob(link, i, this.notifyStatusUpdate))
  }

  static parse(linkQueueJson) {
    const linkQueue = new LinksQueue()
    // parse shallow props
    Object.assign(linkQueue, linkQueueJson)

    // parse jobQueue array
    linkQueue.jobQueue = (linkQueueJson.jobQueue || []).map(linkJobJson => {
      const linkJob = new LinkJob()
      Object.assign(linkJob, linkJobJson)
      linkJob.onStatusUpdate = linkQueue.notifyStatusUpdate
      return linkJob
    })

    return linkQueue
  }

  setState = (state) => {
    console.log(`[LinkQueue] queue state change `, this.state, ' -> ', state)
    Object.assign(this.state, state)
    this.notifyStatusUpdate(state)
  }

  notifyStatusUpdate = (update) => {
    // dispatch message like this, because it's sent locally (from background to background)
    const message = { type: 'update-queue', data: this, update }
    const sender = { tab: null, id: chrome.runtime.id }
    const sendResponse = () => {
    }
    chrome.runtime.onMessage.dispatch(message, sender, sendResponse)
  }

  start = () => {
    this._checkCanStart()
    console.log(`[LinksQueue] Starting queue (${this.jobQueue.length} jobs).`)
    this._start()
    this._run()
  }

  _start = () => {
    this.setState({ started: true })
  }

  _finish = () => {
    this.setState({ running: false, finished: true })
  }

  _running = (running = true) => {
    Object.assign(this.state, { running })
  }

  _checkCanStart = () => {
    if (this.state.finished) {
      throw new Error('Job is already finished, can\'t start.') //TODO implement re-start
    }

    if (this.state.running) {
      throw new Error('Job is already running, can\'t start.')
    }

    if (this.state.started) {
      throw new Error('Job was already started!')
    }

    if (this.jobQueue.length === 0) {
      console.log('[LinksQueue] Can\'t start, no links to process.')
      throw new Error('Can\'t start queue, no links to process. Add some links first.')
    }
  }

  /**
   *
   * @return {LinkJob|null}
   * @private
   */
  _getNextPendingJob = () => {
    const pendingJobs = this.jobQueue.filter(({ state: { result } }) => !result)
    if (pendingJobs.length === 0) {
      return null
    }

    return pendingJobs[0]
  }

  _run = () => {
    const currentJob = this._getNextPendingJob()
    if (!currentJob) {
      console.log('[LinksQueue] No more pending jobs left.')
      this._finish()
      return
    }

    if (this.state.finished) {
      // job was finished externally - return to break the chain
      return
    }

    this._running(true)
    const { index } = currentJob
    console.log(`[LinksQueue] starting job ${index}`, currentJob)

    currentJob.process()
      .then(() => {
        console.log(`[LinksQueue] job ${index} completed succesfully`, currentJob, '. Continuing to next job...')
        setTimeout(() => this._run(), 1)
      })
      .catch(error => {
        console.log(`[LinksQueue] job ${index} finished with error:`, error, currentJob, '. Continuing to next job...')
        setTimeout(() => this._run(), 1)
      })
  }
}

export default LinksQueue
