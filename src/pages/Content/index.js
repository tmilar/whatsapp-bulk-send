import Whatsapp from './modules/whatsapp'
const whatsapp = new Whatsapp()

console.log('Content script loaded!')

function sendUpdateNotification({status}) {
  chrome.runtime.sendMessage({type: "update-link", data: {status}})
}

const pollUntilSentMessageReceived = () => {
  let tries = 0
  const maxTries = 30
  const interval = 2000
  let prevStatus = null
  console.log("Start polling until sent message is received", {maxTries, interval})
  const checkReceived = setInterval(() => {
    const {message, status} = whatsapp.getLastSentMessage()
    if(status !== prevStatus) {
      sendUpdateNotification({status})
    }
    if(status === "SENT_RECEIVED") {
      console.log("Message received!")
      clearInterval(checkReceived)
      // close tab???
      return
    }
    console.log("Sent message status: ", status)
    prevStatus = status
    tries++
    if(tries === maxTries) {
      console.log(`Maximum attemps (${tries}) reached, abort. `)
      sendUpdateNotification({status: "AFTER_SEND_ABORT"})
      clearInterval(checkReceived)
    }
  }, interval)
}

const pollUntilMessageSent = () => {
  let tries = 0
  const maxTries = 30
  const interval = 2000
  console.log("Start polling until message is sent",  {maxTries, interval})

  const autoSend = setInterval(() => {
    try {
      whatsapp.submitSendMessage()
      console.log("Message sent!")
      clearInterval(autoSend)
      pollUntilSentMessageReceived()
      return
    } catch(error) {
      console.log("Send message attempt failed, retrying. ", error)
    }

    tries++
    if(tries === maxTries) {
      console.log(`Maximum attemps (${tries}) reached, abort. `)
      sendUpdateNotification({status: "SEND_ABORT"})
      clearInterval(autoSend)
    }

  }, interval)
}

console.log("Start polling send")
pollUntilMessageSent()
