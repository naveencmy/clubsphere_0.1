export const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format((amount || 0) / 100);
export const date = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
export const datetime = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
export const initials = (name) =>
  (name || '?')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('');
export const label = (value) =>
  (value || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
export function download(name, content, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(rows) {
  return rows
    .map((row) =>
      row
        .map(
          (v) =>
            '"' +
            String(v ?? '')
              .replace(/^[=+@-]/, "'$&")
              .replaceAll('"', '""') +
            '"',
        )
        .join(','),
    )
    .join('\r\n');
}
