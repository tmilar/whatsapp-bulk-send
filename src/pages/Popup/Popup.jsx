import React, { Component, useCallback, useEffect, useState } from 'react'
import './Popup.css'
import LinksForm from '../../containers/LinksForm/LinksForm'
import LinksTable from '../../containers/LinksTable/LinksTable'

const fetchSavedLinks = () => new Promise((resolve, reject) =>
  chrome.storage.sync.get('links', ({ links = [] }) => {
    if (chrome.runtime.error) {
      console.log('fetchSavedLinks chrome.runtime.error', chrome.runtime.error)
      return reject(chrome.runtime.error)
    }
    return resolve(links)
  }),
)

const requestQueueStart = () => new Promise((resolve, reject) =>
  chrome.runtime.sendMessage({ type: 'start' }, ({ status, error }) => {
    if (chrome.runtime.lastError) {
      console.log('requestQueueStart chrome.runtime.lastError', chrome.runtime.lastError)
      return reject(chrome.runtime.lastError)
    }

    if (status !== 200) {
      reject(error)
      return
    }
    return resolve()
  }),
)

const Popup = () => {
  const [links, setLinks] = useState([])
  const [queueStatus, setQueueStatus] = useState(null)

  const syncLinks = () => fetchSavedLinks()
    .then(links => {
      setLinks(links)
    })
    .catch(error => {
      console.error(error)
    })

  useEffect(() => {
    syncLinks()
  }, [])

  const queueStart = () => requestQueueStart()
    .then(() => setQueueStatus({status: "RUNNING", message: "Comenzado!"}))
    .catch(error => setQueueStatus({status: "ERROR", message: `No se pudo empezar. ${error.message || error || ""}`}))

  const syncLinksCallback = useCallback(syncLinks, [])
  const handleStartButtonClick = useCallback(queueStart, [])

  return <div>
    <h1>Enviar mensajes de Whatsapp</h1>
    <span>Colocar los links de Whatsapp aqui debajo.</span>
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
    }}>
      <LinksForm onSubmit={syncLinksCallback}/>
    </div>
    <button className={'button'} style={{ background: 'lightcoral' }} onClick={handleStartButtonClick}>Comenzar</button>
    {queueStatus && (<><br/><span>{queueStatus.message}</span></>)}
    <h2>Links actuales:</h2>
    <LinksTable links={links}/>
  </div>

}

export default Popup
