function escapeCell(value) {
  let text = String(value ?? '')
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function createCsv(rows, columns) {
  return [
    columns.map((column) => column.header),
    ...rows.map((row) =>
      columns.map((column) =>
        column.value ? column.value(row) : row[column.key],
      ),
    ),
  ]
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n')
}

export function downloadCsv(filename, rows, columns) {
  const blob = new Blob([`\uFEFF${createCsv(rows, columns)}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}