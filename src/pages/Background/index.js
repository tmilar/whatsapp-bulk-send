import '../../assets/img/icon-34.png'
import '../../assets/img/icon-128.png'
import LinksQueue from './links-queue'

console.log('This is the background page.')

// open the page
chrome.browserAction.onClicked.addListener(() => {
  const bgPageUrl = chrome.extension.getURL('popup.html')
  console.log('Opening ', bgPageUrl)
  chrome.tabs.create({ url: bgPageUrl })
})

const getSavedLinksQueue = () =>
  new Promise((resolve, reject) =>
    chrome.storage.local.get('linksQueue', ({ linksQueue: linksQueueData = null }) => {
      if (chrome.runtime.lastError) {
        const errorMsg = `get linksQueue chrome.runtime.lastError: ${chrome.runtime.lastError.message}`
        console.log(errorMsg)
        reject(errorMsg)
        return
      }

      const linksQueue = LinksQueue.parse(linksQueueData)
      resolve(linksQueue)
    }),
  )

const saveLinksQueue = function(queue, sendResponse) {
  chrome.storage.local.set({ linksQueue: queue }, async () => {
    if (chrome.runtime.lastError) {
      const errorMsg = `set linksQueue chrome.runtime.lastError: ${chrome.runtime.lastError.message}`
      console.log(errorMsg)
      return sendResponse({ status: 500, message: errorMsg })
    }

    // check that links data are saved OK
    try {
      const linksQueue = await getSavedLinksQueue()
      // saved OK
      console.log('Saved links queue: ', linksQueue)
      return sendResponse({ status: 200 })
    } catch (error) {
      return sendResponse({ status: 500, message: error })
    }
  })
}

const state = {
  currentQueue: null,
}

// startup: fetch saved queue data
getSavedLinksQueue()
  .then(queue => {
    console.log('Startup: retrieving saved queue data: ', queue)
    state.currentQueue = queue
  })
  .catch(error => console.error('Could not retrieve saved queue data', error))

const handleSetLinksMessage = (links, sendResponse) => {
  const queue = new LinksQueue(links)
  state.currentQueue = queue
  saveLinksQueue(queue, sendResponse)
}

async function runOnCurrentQueue(applyOnQueue) {
  if (!state.currentQueue) {
    throw new Error('Can\'t run operation, the current queue has not been loaded yet')
  }
  return applyOnQueue(state.currentQueue)
}

const handleOperationOnQueueMessage = (operation, sendResponse) => {
  runOnCurrentQueue(operation)
    .then(() => sendResponse({ status: 200 }))
    .catch(error => {
      const message = error ? error.message || error : ''
      console.log(`Error for operation: '${operation.toString()}'. ${message}`)
      sendResponse({ status: 500, message })
    })
}

const handleUpdatedQueueMessage = (linksQueue, sendResponse) => {
  console.log('message to save updated queue status')
  saveLinksQueue(linksQueue, sendResponse)
}

const messageHandler = {
  'set-links': ({ data, sendResponse }) => handleSetLinksMessage(data, sendResponse),
  'update-queue': ({ data, sendResponse }) => handleUpdatedQueueMessage(data, sendResponse),
  start: ({ sendResponse }) => handleOperationOnQueueMessage(queue => queue.start(), sendResponse),
  pause: ({ sendResponse }) => handleOperationOnQueueMessage(queue => queue.pause(), sendResponse),
  resume: ({ sendResponse }) => handleOperationOnQueueMessage(queue => queue.resume(), sendResponse),
  stop: ({ sendResponse }) => handleOperationOnQueueMessage(queue => queue.stop(), sendResponse),
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { type, data } = request
  console.log(`Background onMessage type '${type}'`, request)

  const handler = messageHandler[type]
  if (!handler) {
    sendResponse({ status: 404, message: `message type '${type}' not handled` })
    return true
  }

  handler({ data, sendResponse })
  return true
})
