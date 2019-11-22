import React, { Component, useCallback, useEffect, useState } from 'react'
import './Popup.css'
import LinksForm from '../../containers/LinksForm/LinksForm'
import LinksTable from '../../containers/LinksTable/LinksTable'

const fetchLinksQueue = () => new Promise((resolve, reject) =>
  chrome.storage.sync.get('linksQueue', ({ linksQueue = null }) => {
    if (chrome.runtime.error) {
      console.log('fetchLinksQueue chrome.runtime.error', chrome.runtime.error)
      return reject(chrome.runtime.error)
    }
    return resolve(linksQueue)
  }),
)

const requestQueueStart = () => new Promise((resolve, reject) =>
  chrome.runtime.sendMessage({ type: 'start' }, ({ status, message }) => {
    if (chrome.runtime.lastError) {
      console.log('requestQueueStart chrome.runtime.lastError', chrome.runtime.lastError)
      return reject(chrome.runtime.lastError)
    }

    if (status !== 200) {
      reject(message)
      return
    }
    return resolve()
  }),
)

const Popup = () => {
  const [linksQueue, setLinksQueue] = useState(null)
  const [queueStatus, setQueueStatus] = useState(null)

  const syncLinksQueue = () => fetchLinksQueue()
    .then(linksQueue => {
      // console.log('retrieved linksQueue: ', linksQueue)
      setLinksQueue(linksQueue)
    })
    .catch(error => {
      console.error(error)
    })

  useEffect(() => {
    // first sync
    syncLinksQueue()

    // set re-sync after every 5 secs
    const resyncInterval = 3000
    const interval = setInterval(() => {
      return syncLinksQueue()
    }, resyncInterval)

    return () => clearInterval(interval)
  }, [])

  const queueStart = () => requestQueueStart()
    .then(() => setQueueStatus({status: "RUNNING", message: "Comenzado"}))
    .catch(error => {
      setQueueStatus({status: "ERROR", message: `No se pudo empezar. ${error ? (error.message || error) : ''}`})
    })

  const syncLinksQueueCallback = useCallback(syncLinksQueue, [])
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
      <LinksForm onSubmit={syncLinksQueueCallback}/>
    </div>
    <button className={'button'} style={{ background: 'lightcoral' }} onClick={handleStartButtonClick}>Comenzar</button>
    {queueStatus && (<><br/><span>{queueStatus.message}</span></>)}
    <h2>Links actuales:</h2>
    <LinksTable linksQueue={linksQueue}/>
  </div>

}

export default Popup
