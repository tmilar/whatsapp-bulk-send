import React, { Component } from 'react'
import './Popup.css'
import LinksForm from '../../containers/LinksForm/LinksForm'

class Popup extends Component {
  render() {
    return (
      <div>
        <h1>Enviar mensajes de Whatsapp</h1>
        <span>Colocar los links de Whatsapp aqui debajo.</span>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
          }}
        >
          <LinksForm/>
        </div>
      </div>
    )
  }
}

export default Popup
