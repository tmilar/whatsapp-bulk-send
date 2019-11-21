import React from 'react'

const EmptyDataMessage = () => <tr>
  <td><i>No hay links en proceso.</i></td>
</tr>

const TableData = ({ links }) => links.map((link, i) => <tr key={`link-table-row_${i}_${link}`}>
  <td>{link}</td>
</tr>)

export default ({ links = [] }) => <table>
  <tbody>
  {links.length === 0 ? <EmptyDataMessage/> : <TableData links={links}/>}
  </tbody>
</table>
