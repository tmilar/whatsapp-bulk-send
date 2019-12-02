import React, { Component, useCallback, useEffect, useState } from 'react'
import './Popup.css'
import LinksForm from '../../containers/LinksForm/LinksForm'
import LinksTable from '../../containers/LinksTable/LinksTable'
import LinksQueueActionButtons from '../../containers/LinksQueueActionButtons/LinksQueueActionButtons'

const fetchLinksQueue = () =>
  new Promise((resolve, reject) =>
    chrome.storage.local.get('linksQueue', ({ linksQueue = null }) => {
      if (chrome.runtime.lastError) {
        const errorMsg = `get linksQueue chrome.runtime.lastError: ${chrome.runtime.lastError.message}`
        console.log(errorMsg)
        reject(errorMsg)
        return
      }
      return resolve(linksQueue)
    }),
  )

const requestQueueOperation = ({ type }) =>
  new Promise((resolve, reject) =>
    chrome.runtime.sendMessage({ type }, ({ status, message }) => {
      if (chrome.runtime.lastError) {
        const errorMsg = `requestQueueOperation '${type}' chrome.runtime.lastError: ${chrome.runtime.lastError.message}`
        console.log(errorMsg)
        reject(errorMsg)
        return
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
  const [loading, setLoading] = useState(false)

  const syncLinksQueue = () =>
    fetchLinksQueue()
      .then(linksQueue => {
        // console.log('retrieved linksQueue: ', linksQueue)
        setLinksQueue(linksQueue)
      })
      .catch(error => {
        console.error(error)
      })

  useEffect(() => {
    // first sync
    setLoading(true)
    syncLinksQueue()
      .then(() => setLoading(false))

    // set re-sync after every 2 secs
    const resyncInterval = 20000
    let timeout
    let updatedResyncTimeout
    const runResync = () => {
      let start = Date.now()
      let useUpdatedResync = typeof updatedResyncTimeout === 'number'
      // console.log(`Setting timeout to ${useUpdatedResync ? 'updatedResyncTimeout' + updatedResyncTimeout : 'resyncInterval' + resyncInterval}`)
      timeout = setTimeout(() => {
        syncLinksQueue().then(() => {
          let end = Date.now()
          let elapsed = end - start
          updatedResyncTimeout = resyncInterval - elapsed
          // console.log(`Would set timeout to ${updatedResyncTimeout}`)
        }).then(runResync)
      },  useUpdatedResync ? updatedResyncTimeout : resyncInterval)
    }

    runResync()

    return () => clearTimeout(timeout)
  }, [])

  const requestQueueStatusUpdate = ({ type, onSuccessMsg, onErrorMsg }) =>
    requestQueueOperation({ type })
      .then(() => setQueueStatus({ message: onSuccessMsg }))
      .catch(error => setQueueStatus({ message: onErrorMsg(error) }))

  const queueStart = () =>
    requestQueueStatusUpdate({
      type: 'start',
      onSuccessMsg: 'Comenzado!',
      onErrorMsg: error => `No se pudo empezar. ${error ? error.message || error : ''}`,
    })

  const queuePause = () =>
    requestQueueStatusUpdate({
      type: 'pause',
      onSuccessMsg: 'En pausa',
      onErrorMsg: error => `No se pudo pausar. ${error ? error.message || error : ''}`,
    })

  const queueResume = () =>
    requestQueueStatusUpdate({
      type: 'resume',
      onSuccessMsg: 'Continuando',
      onErrorMsg: error => `No se pudo continuar. ${error ? error.message || error : ''}`,
    })

  const queueStop = () =>
    requestQueueStatusUpdate({
      type: 'stop',
      onSuccessMsg: 'Finalizado',
      onErrorMsg: error => `No se pudo finalizar. ${error ? error.message || error : ''}`,
    })

  const syncLinksQueueCallback = useCallback(syncLinksQueue, [])
  const handleQueueStartAction = useCallback(queueStart, [])
  const handleQueuePauseAction = useCallback(queuePause, [])
  const handleQueueResumeAction = useCallback(queueResume, [])
  const handleQueueStopAction = useCallback(queueStop, [])

  return (
    <div>
      <h1>Enviar mensajes de Whatsapp</h1>
      <span>Colocar los links de Whatsapp aqui debajo.</span>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <LinksForm onSubmit={syncLinksQueueCallback}/>
      </div>
      {linksQueue &&
      <LinksQueueActionButtons queue={linksQueue}
                               onStartAction={handleQueueStartAction}
                               onPauseAction={handleQueuePauseAction}
                               onStopAction={handleQueueStopAction}
                               onResumeAction={handleQueueResumeAction}
      />
      }
      {queueStatus && (
        <>
          <br/>
          <span>{queueStatus.message}</span>
        </>
      )}
      <h2>Links actuales:</h2>
      <LinksTable loading={loading} linksQueue={linksQueue}/>
    </div>
  )
}

export default Popup
