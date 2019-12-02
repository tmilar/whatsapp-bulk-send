import React, { Component, useCallback, useEffect, useState } from 'react'
import './Popup.css'
import LinksForm from '../../containers/LinksForm/LinksForm'
import LinksTable from '../../containers/LinksTable/LinksTable'
import LinksQueueActions from '../../containers/LinksQueueActions/LinksQueueActions'

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
    const resyncInterval = 2000
    let timeout
    let updatedResyncTimeout
    const runResync = () => {
      let start = Date.now()
      let useUpdatedResync = typeof updatedResyncTimeout === 'number'
      timeout = setTimeout(() => {
        syncLinksQueue().then(() => {
          let end = Date.now()
          let elapsed = end - start
          updatedResyncTimeout = resyncInterval - elapsed
        }).then(runResync)
      },  useUpdatedResync ? updatedResyncTimeout : resyncInterval)
    }

    runResync()

    return () => clearTimeout(timeout)
  }, [])

  const syncLinksQueueCallback = useCallback(syncLinksQueue, [])

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
      <h2>Links actuales:</h2>
      {linksQueue && <LinksQueueActions queue={linksQueue} onQueueAction={requestQueueOperation}/> }
      <LinksTable loading={loading} linksQueue={linksQueue}/>
    </div>
  )
}

export default Popup
