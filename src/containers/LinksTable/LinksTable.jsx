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

const TableData = ({ links }) =>
  links.map(({ index, url, state: { result, statusDetail, error }, startTimestamp, endTimestamp }, i) =>
    <tr key={`link-table-row_${i}_${url}`}>
      <td>{index}</td>
      <td>{url}</td>
      <td>{result}</td>
      <td>{statusDetail}</td>
      <td>{error}</td>
      <td>{(endTimestamp && startTimestamp) && elapsedTimeSecs(startTimestamp, endTimestamp)}</td>
    </tr>,
  )

const getActiveStatuses = ({ state } = {}) => (Object.entries(state) || []).filter(([key, value]) => value).map(([key, value]) => key).join(', ')

export default ({ linksQueue }) =>
  <>
    <span>Estado: {linksQueue && (<b>{getActiveStatuses(linksQueue)}</b>)}</span>
    <br/>
    <table>
      <tbody>
      {(!linksQueue || linksQueue.jobQueue.length === 0) ? <EmptyDataMessage/> :
        <TableData links={linksQueue.jobQueue}/>}
      </tbody>
    </table>
  </>
