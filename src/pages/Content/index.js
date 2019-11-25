import Whatsapp from './modules/whatsapp'

const whatsapp = new Whatsapp()
const state = {
  channel: null,
}

console.log('Content script loaded!')

function sendUpdateNotification({ status }) {
  state.channel.postMessage({ type: 'update-link', data: { status } })
}

const pollUntilSentMessageReceived = () => {
  let tries = 0
  const maxTries = 30
  const interval = 2000
  let prevStatus = null
  console.log('Start polling until sent message is received', { maxTries, interval })
  const checkReceived = setInterval(() => {
    const { message, status } = whatsapp.getLastSentMessage()
    if (status !== prevStatus) {
      sendUpdateNotification({ status })
    }
    if (status === 'SENT_RECEIVED') {
      console.log('Message received!')
      clearInterval(checkReceived)
      // close tab???
      return
    }
    console.log('Sent message status: ', status)
    prevStatus = status
    tries++
    if (tries === maxTries) {
      console.log(`Maximum attemps (${tries}) reached, abort. `)
      sendUpdateNotification({ status: 'SENT_CHECK_ABORT' })
      clearInterval(checkReceived)
    }
  }, interval)
}

const pollUntilMessageSent = () => {
  let tries = 0
  const maxTries = 30
  const interval = 2000
  console.log('Start polling until message is sent', { maxTries, interval })

  const autoSend = setInterval(() => {
    try {
      whatsapp.submitSendMessage()
      console.log('Message sent!')
      clearInterval(autoSend)
      pollUntilSentMessageReceived()
      return
    } catch (error) {
      console.log('Send message attempt failed, retrying. ', error)
    }

    // check for invalid number error
    if (whatsapp.hasInvalidNumberError()) {
      console.log('Specified number is invalid')
      sendUpdateNotification({ status: 'INVALID_NUMBER_ABORT' })
      clearInterval(autoSend)
    }

    // check if maximum attempts exceeded
    tries++
    if (tries === maxTries) {
      console.log(`Maximum attemps (${tries}) reached, abort. `)
      sendUpdateNotification({ status: 'SEND_ABORT' })
      clearInterval(autoSend)
    }

  }, interval)
}

const start = () => {
  if (window.location.href.indexOf('https://web.whatsapp.com') < 0) {
    console.log('Not whatsapp site. ')
    return
  }
  console.log('Listening for connections')

  chrome.runtime.onConnect.addListener(channel => {
    if (channel.name !== 'channel-whatsapp-send') {
      console.error('Unexpected connection request from channel', channel)
      throw new Error('Unexpected connection request')
    }

    state.channel = channel

    channel.onMessage.addListener((request, sender) => {
      if (request.type !== 'start-whatsapp-send') {
        console.log('Unexpected message: ', request, sender)
        return
      }

      pollUntilMessageSent()
    })
  })
}

start()
