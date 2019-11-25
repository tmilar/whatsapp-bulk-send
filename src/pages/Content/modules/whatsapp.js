export default () => {
  // helpers
  const getOneElementByXpath = path =>
    document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      .singleNodeValue

  const _xPathResultsToArray = xPathResult => {
    const nodes = []
    let node = xPathResult.iterateNext()
    while (node) {
      nodes.push(node)
      node = xPathResult.iterateNext()
    }
    return nodes
  }

  const getElementsByXpath = path =>
    _xPathResultsToArray(document.evaluate(path, document, null, XPathResult.ANY_TYPE, null))

  // parser
  const getSubmitMsgButton = () =>
    getOneElementByXpath('//*[@id="main"]/footer/div[1]/div[3]/button')

  const getLastSentMessage = () => {
    const sentMessages = getElementsByXpath(
      "//*[@id=\"main\"]//div[contains(@class, 'message-out')]//span[contains(@class, 'selectable-text')]/span"
    )
    if (!sentMessages || !sentMessages.length) {
      return null
    }
    const { innerText: message } = sentMessages.pop()

    const sentMessagesStatuses = getElementsByXpath(
      '//*[@id="main"]//div[contains(@class, \'message-out\')]/div[1]/div[1]/div[1]/div[2]//span[@data-icon]'
    )
    const lastSentMessageStatus = sentMessagesStatuses.pop()
    const statusIcon = lastSentMessageStatus.getAttribute('data-icon')
    const statusIcons = {
      'msg-dblcheck': 'SENT_RECEIVED',
      'msg-check': 'SENT',
      'msg-time': 'WAITING',
    }
    const status = statusIcons[statusIcon]

    return {
      message,
      status,
    }
  }

  // methods
  const submitSendMessage = () => {
    const submitBtn = getSubmitMsgButton()
    if (!submitBtn) {
      throw new Error('No submit button found')
    }
    console.log('Submitted message')
    submitBtn.click()
  }

  const hasInvalidNumberError = () => {
    const errorMessageBoxTextEl = getOneElementByXpath(
      '//div[@data-animate-modal-body]/div[1]/text()'
    )
    if (errorMessageBoxTextEl) {
      const { textContent: message } = errorMessageBoxTextEl
      const invalidNumberErrorRegex = /inv[aá]lid/
      return !!message.match(invalidNumberErrorRegex)
    }
    return false
  }

  return {
    submitSendMessage,
    getLastSentMessage,
    hasInvalidNumberError,
  }
}
