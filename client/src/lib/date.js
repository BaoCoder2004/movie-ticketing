export function toLocalInputValue(d = new Date()) {
  // datetime-local format: YYYY-MM-DDTHH:mm (local time)
  const pad = (n) => String(n).padStart(2,'0');
  const y = d.getFullYear();
  const m = pad(d.getMonth()+1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${mi}`;
}
export function localValueToISO(v) {
  // v: 'YYYY-MM-DDTHH:mm' in local → ISO8601 UTC
  if (!v) return null;
  const d = new Date(v);
  return d.toISOString();
}
