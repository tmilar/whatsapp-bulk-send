import React, { useCallback, useEffect, useState } from 'react'

const EmptyDataMessage = ({ loading }) => (
  <tr>
    <td colSpan="100%">
      <i>{loading ? 'Recuperando links guardados...' : 'No hay links en proceso.'}</i>
    </td>
  </tr>
)

function roundNumber(num, scale) {
  if (!('' + num).includes('e')) {
    return +(Math.round(num + 'e+' + scale) + 'e-' + scale)
  } else {
    const arr = ('' + num).split('e')
    let sig = ''
    if (+arr[1] + scale > 0) {
      sig = '+'
    }
    return +(Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) + 'e-' + scale)
  }
}

const elapsedTimeSecs = (start, end) => `${roundNumber((end - start) / 1000, 1)} seg`

const linkClassNames = {
  success: 'success',
  error: 'error',
  inProgress: 'in-progress',
}

function getStatusClassName(statusValue) {
  if (!statusValue || statusValue.length === 0) {
    return ''
  }
  const { success, error, inProgress } = linkClassNames
  const statusValueContainsAny = (...keywords) => keywords.some(k => statusValue.indexOf(k) >= 0)

  if (statusValueContainsAny('SENT', 'SUCCESS', 'WAITING')) {
    return success
  }
  if (statusValueContainsAny('ERROR', 'ABORT')) {
    return error
  }
  if (statusValueContainsAny('PROGRESS')) {
    return inProgress
  }
  return ''
}

const i18nValues = {
  result: {
    SUCCESS: 'OK',
    ERROR: 'Error',
  },
  statusDetail: {
    STARTING: 'Iniciando...',
    IN_PROGRESS: 'En progreso',
    WAITING: 'Enviado',
    SENT: 'Enviado',
    SENT_RECEIVED: 'Enviado',
    INVALID_NUMBER_ABORT: 'El número es inválido',
    SEND_ABORT: 'No se pudo enviar',
    SENT_CHECK_ABORT: 'No se pudo verificar recepción del mensaje',
    UNEXPECTED_ABORT: 'Interrumpido inesperadamente',
  },
}

const i18n = (key, value) => i18nValues[key][value] || value

const TableData = ({ links }) =>
  links.map(
    ({ index, url, state: { result, statusDetail, error }, startTimestamp, endTimestamp }, i) => (
      <tr key={`link-table-row_${i}_${url}`}>
        <td>{index + 1}</td>
        <td>
          <div className={'ellipsis multiline-wrap'}>
            <div>{url}</div>
          </div>

        </td>
        <td className={getStatusClassName(result)}>{result ? i18n('result', result) : ''}</td>
        <td className={getStatusClassName(statusDetail)}>{i18n('statusDetail', statusDetail)}</td>
        <td className={'link-error'}>{error}</td>
        <td>{endTimestamp && startTimestamp && elapsedTimeSecs(startTimestamp, endTimestamp)}</td>
      </tr>
    ),
  )

const getActiveStatuses = ({ state } = {}) =>
  (Object.entries(state) || [])
    .filter(([key, value]) => value)
    .map(([key, value]) => key)
    .join(', ')

const _copyElement = el => {
  if (!el) {
    throw new Error('Element to copy must be defined ')
  }
  const body = document.body
  let range, sel

  if (document.createRange && window.getSelection) {
    range = document.createRange()
    sel = window.getSelection()
    sel.removeAllRanges()
    try {
      range.selectNodeContents(el)
      sel.addRange(range)
    } catch (e) {
      range.selectNode(el)
      sel.addRange(range)
    }
    document.execCommand('copy')
    sel.removeRange(range)

  } else if (body.createTextRange) {
    range = body.createTextRange()
    range.moveToElementText(el)
    range.select()
    range.execCommand('Copy')
  }
  window.getSelection().removeAllRanges()
}

const handleCopyAction = ({ jobQueue }) => {
  const el = (document.getElementsByClassName('links-table') || [])[0]
  console.log('Copying...')
  _copyElement(el)
  console.log(`Copied links queue table to clipboard (${jobQueue.length} links)`)
}

const copyingStates = {
  DEFAULT: 'Copiar',
  COPYING: 'Copiando...',
  COPIED: 'Copiado!',
}

export default ({ linksQueue, loading }) => {
  const [copying, setCopying] = useState(copyingStates.DEFAULT)

  useEffect(() => {
    if (copying === copyingStates.COPYING) {
      handleCopyAction(linksQueue)
      setCopying(copyingStates.COPIED)
      setTimeout(() => {
        setCopying(copyingStates.DEFAULT)
      }, 2000)
    }
  }, [copying])

  const handleCopyActionCb = useCallback(e => {
    e.preventDefault()
    setCopying(copyingStates.COPYING)
  }, [])

  const linksQueueEmpty = !linksQueue || linksQueue.jobQueue.length === 0

  return <>
    <div className={`links-table-status ${linksQueueEmpty ? 'hide' : ''}`}>
      <span>Estado: {linksQueue && <b>{getActiveStatuses(linksQueue)}</b>}</span>
      <a href="#" onClick={handleCopyActionCb}>{copying}</a>
    </div>
    <br/>
    <table className={'links-table'} border="0" cellSpacing="0" cellPadding="0">
      <thead>
      <tr>
        <th>#</th>
        <th>Link</th>
        <th>Resultado</th>
        <th>Detalle</th>
        <th>Comentarios</th>
        <th>Duración</th>
      </tr>
      </thead>
      <tbody>
      {linksQueueEmpty ? (
        <EmptyDataMessage loading={loading}/>
      ) : (
        <TableData links={linksQueue.jobQueue}/>
      )}
      </tbody>
    </table>
  </>
}
