/**
 * Safe RFC 4180 CSV & text export utilities with spreadsheet formula-injection neutralization.
 * Prevents Excel/LibreOffice formula execution (=, +, @, \t, \r, or leading formula minus).
 */

export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  const str = String(value);
  const needsFormulaGuard =
    str.length > 0 &&
    (['=', '+', '@', '\t', '\r'].includes(str[0]) ||
      (str[0] === '-' && str.length > 1 && !/^-\d+(\.\d+)?$/.test(str)));
  const neutralized = needsFormulaGuard ? `'${str}` : str;
  const escaped = neutralized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function triggerBlobDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCsvFile({ filename, headers, rows, preRows = [], includeBom = true }) {
  const serializeRow = (cols) => cols.map(sanitizeCsvCell).join(',');
  const lines = [];
  for (const row of preRows) {
    lines.push(Array.isArray(row) ? serializeRow(row) : '');
  }
  if (Array.isArray(headers) && headers.length > 0) {
    lines.push(serializeRow(headers));
  }
  for (const row of rows || []) {
    lines.push(Array.isArray(row) ? serializeRow(row) : '');
  }
  const prefix = includeBom ? '\uFEFF' : '';
  const blob = new Blob([prefix + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(filename, blob);
}

export function downloadTextFile({ filename, content, mimeType = 'text/csv;charset=utf-8;' }) {
  const blob = new Blob([content], { type: mimeType });
  triggerBlobDownload(filename, blob);
}
