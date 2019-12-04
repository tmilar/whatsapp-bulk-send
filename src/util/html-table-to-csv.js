/**
 * Build CSV string from HTML table, query by id
 *
 * @param tableId {string}
 * @return {string} - csv content string
 */
export function htmlTableToCsv(tableId) {
  // Select rows from table_id
  const rows = document.querySelectorAll('table#' + tableId + ' tr')

  // Construct csv
  const csv = []
  for (let i = 0; i < rows.length; i++) {
    const row = [], cols = rows[i].querySelectorAll('td, th')
    for (let j = 0; j < cols.length; j++) {
      // Clean innertext to remove multiple spaces and jumpline (break csv)
      let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')
      // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
      data = data.replace(/"/g, '""')
      // Push escaped string
      row.push('"' + data + '"')
    }
    csv.push(row.join(';'))
  }

  return csv.join('\n')
}

/**
 * Quick and simple export target #table_id into a csv
 * source: https://stackoverflow.com/a/56370447/6279385
 *
 * @param tableId
 */
export function downloadHtmlTableAsCsv({tableId, title = ''}) {
  // Build CSV content from HTML table
  const csvString = htmlTableToCsv(tableId)

  // Download it
  const dateStr = new Date().toISOString().slice(0,-5).replace("T", "_").replace(/:/g, "-")
  const filename = ['export', title, dateStr].join("_") + '.csv'

  const link = document.createElement('a')
  link.style.display = 'none'
  link.setAttribute('target', '_blank')
  link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString))
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
