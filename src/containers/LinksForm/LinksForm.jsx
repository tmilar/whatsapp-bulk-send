import React, { Component } from 'react'
import useForm from '../../hooks/use-form'

const submitWhatsappLinks = async links => {
  return new Promise((resolve, reject) =>
    chrome.runtime.sendMessage({ type: 'set-links', data: links }, (response = {}) => {
      if (chrome.runtime.error) {
        console.log('chrome.runtime.error', chrome.runtime.error)
        reject(chrome.runtime.error)
        return
      }

      console.log('Message \'set-links\' got response: ', response)

      const { status, message } = response
      if (status !== 200) {
        console.log('Submit response error', response, status, message)
        reject(message)
        return
      }
      resolve()
    }),
  )
}

const handleKeyDown = e => {
  e.target.style.height = 'inherit'
  // In case you have a limitation
  // limit to 40% of window height
  const limit = window.innerHeight * 0.4
  e.target.style.height = `${Math.min(e.target.scrollHeight, limit) + 5}px`
}

const parseLinks = links => links && links.split('\n').filter(l => l.length > 0)

const LinksForm = (props) => {
  const {
    values,
    submitState,
    handleChange,
    handleSubmit,
    handleBlur,
  } = useForm({
    initialValues: {
      links: '',
    },
    async onSubmit(values, errors, onComplete) {
      const { links: linksText } = values
      const links = parseLinks(linksText)

      if (!links || links.length === 0) {
        alert('No se ha ingresado ningun link de envio de whatsapp.')
        onComplete({ ok: true })
        return
      }

      try {
        console.log('Submitting links')
        await submitWhatsappLinks(links)
        console.log('Sumitted links OK')
        onComplete({ ok: true })
        await props.onSubmit()
      } catch (error) {
        console.error('Form submit error', error)
        onComplete({ ok: false, error })
      }
    },
  })

  const linksCount = (parseLinks(values.links) || []).length
  const submitDisabled = submitState && submitState.loading
  const submitError = submitState && submitState.ok === false

  return <form className={'form'} onSubmit={handleSubmit}>
    <textarea name="links" value={values.links} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDown}/>
    {!!linksCount && linksCount > 0 && <span>Total: {linksCount} links.</span>}
    <button className={'button'} type="submit" disabled={submitDisabled}>Guardar</button>
    {submitError && submitState.error &&
    <span className={'error'}>Ups, hubo un error: <code>{submitState.error.message || submitState.error}</code></span>}
  </form>
}

LinksForm.defaultProps = {
  onSubmit: () => console.log('[LinksForm] default form submit'),
}

export default LinksForm
