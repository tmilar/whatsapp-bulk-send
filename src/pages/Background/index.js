import '../../assets/img/icon-34.png'
import '../../assets/img/icon-128.png'

console.log('This is the background page.')

// open the page
chrome.browserAction.onClicked.addListener(() => {
  const bgPageUrl = chrome.extension.getURL('popup.html')
  console.log('Opening ', bgPageUrl)
  chrome.tabs.create({ url: bgPageUrl })
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { type, data } = request
  console.log('Background onMessage', request)

  if (type === 'set-links') {
    console.log('message to save links', data)

    chrome.storage.sync.set({ links: data }, () => {

      if (chrome.runtime.error) {
        // error saving links
        console.log('runtime error: ', chrome.runtime.error)
        return sendResponse({ status: 500, message: chrome.runtime.error })
      }

      // check that links data are saved OK
      chrome.storage.sync.get('links', ({ links = [] }) => {
        if (chrome.runtime.error) {
          // error retrieving links
          console.log('runtime error: ', chrome.runtime.error)
          return sendResponse({ status: 500, message: chrome.runtime.error })
        }
        // saved OK
        console.log('Saved links: ', links)
        return sendResponse({ status: 200 })
      })
    })

    return true
  }

  sendResponse({ status: 404, message: `type ${type} not handled` })
  return true
})
