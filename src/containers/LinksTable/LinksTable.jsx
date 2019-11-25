import React from 'react'

const EmptyDataMessage = () => <tr>
  <td><i>No hay links en proceso.</i></td>
</tr>

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

  if (statusValueContainsAny('SENT', 'SUCCESS')) {
    return success
  }
  if (statusValueContainsAny('ERROR', 'ABORT')) {
    return error
  }
  if (statusValueContainsAny('PROGRESS', 'WAIT')) {
    return inProgress
  }
  return ''
}

const i18nValues = {
  result: {
    'SUCCESS': 'OK',
    'ERROR': 'Error',
  },
  statusDetail: {
    'STARTING': 'Iniciando...',
    'IN_PROGRESS': 'En progreso',
    'SENT': 'Enviado',
    'SENT_RECEIVED': 'Enviado y Recibido',
    'INVALID_NUMBER_ABORT': 'El número es inválido',
    'SEND_ABORT': 'No se pudo enviar',
    'SENT_CHECK_ABORT': 'No se pudo verificar recepción del mensaje',
    'UNEXPECTED_ABORT': 'Interrumpido inesperadamente',
  },
}

const i18n = (key, value) => i18nValues[key][value] || value

const TableData = ({ links }) =>
  links.map(({ index, url, state: { result, statusDetail, error }, startTimestamp, endTimestamp }, i) =>
    <tr key={`link-table-row_${i}_${url}`}>
      <td>{index + 1}</td>
      <td>{url}</td>
      <td className={getStatusClassName(result)}>{result ? i18n('result', result) : ''}</td>
      <td className={getStatusClassName(statusDetail)}>{i18n('statusDetail', statusDetail)}</td>
      <td>{error}</td>
      <td>{(endTimestamp && startTimestamp) && elapsedTimeSecs(startTimestamp, endTimestamp)}</td>
    </tr>,
  )

const getActiveStatuses = ({ state } = {}) => (Object.entries(state) || []).filter(([key, value]) => value).map(([key, value]) => key).join(', ')

export default ({ linksQueue }) =>
  <>
    <span>Estado: {linksQueue && (<b>{getActiveStatuses(linksQueue)}</b>)}</span>
    <br/>
    <table border="0" cellSpacing="0" cellPadding="0">
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
      {(!linksQueue || linksQueue.jobQueue.length === 0) ?
        <EmptyDataMessage/> : <TableData links={linksQueue.jobQueue}/>
      }
      </tbody>
    </table>
  </>
