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
        reject('Tab did not open correctly' + (error.message || error || ''))
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

  constructor(link, index) {
    this.url = link
    this.index = index
  }

  setState = state => {
    console.log(`[LinkJob] url '${this.url}' state change `, this.state, ' -> ', state)
    Object.assign(this.state, state)
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
        error: error.message || error,
      })
      throw error
    }
  }
}

class LinksQueue {
  state = {
    pause: false,
    running: false,
    started: false,
    finished: false,
  }

  constructor(links = []) {
    this.jobQueue = links.map((link, i) => new LinkJob(link, i))
  }

  start = () => {
    this._checkCanStart()
    console.log(`[LinksQueue] Starting queue (${this.jobQueue.length} jobs).`)
    Object.assign(this.state, { started: true })
    this._run()
  }

  pause = () => {
    this._checkCanPause()
    Object.assign(this.state, { running: false, pause: true })
  }

  resume = () => {
    this._checkCanResume()
    Object.assign(this.state, { pause: false })
  }

  stop = () => {
    this._checkCanStop()
    this._finish()
  }

  _finish = () => {
    Object.assign(this.state, { running: false, finished: true })
  }

  _running = () => {
    Object.assign(this.state, { running: true })
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

    if (this.state.pause) {
      // job paused, poll to start again until resumed
      setTimeout(() => this._run(), 500)
      return
    }

    this._running()
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

  _checkCanStart = () => {
    if (this.state.finished) {
      //TODO implement re-start
      throw new Error('Job is already finished, can\'t start.')
    }

    if (this.state.running) {
      throw new Error('Job is already running, can\'t start.')
    }

    if (this.jobQueue.length === 0) {
      console.log('[LinksQueue] Can\'t start, no links to process.')
      throw new Error('Can\'t start queue, no links to process.')
    }
  }

  _checkCanPause = () => {
    if (!this.state.running) {
      throw new Error('Job is not running, can\'t pause')
    }
  }

  _checkCanResume = () => {
    if (this.state.running) {
      throw new Error('Job is already running! Can\'t resume')
    }
  }

  _checkCanStop = () => {
    if (this.state.finished) {
      throw new Error('Job is already finished! Can\'t stop.')
    }
  }
}

export default LinksQueue
