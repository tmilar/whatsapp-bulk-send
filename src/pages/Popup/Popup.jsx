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

const Popup = () => {
  const [links, setLinks] = useState([])

  const syncLinks = () => fetchSavedLinks()
    .then(links => {
      console.log('retrieved links: ', links)
      setLinks(links)
    })
    .catch(error => {
      console.error(error)
    })

  useEffect(() => {
    syncLinks()
  }, [])

  const syncLinksCallback = useCallback(syncLinks, [])

  return <div>
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
      <LinksForm onSubmit={syncLinksCallback}/>
    </div>
    <h2>Links en proceso:</h2>
    <LinksTable links={links}/>
  </div>

}

export default Popup
