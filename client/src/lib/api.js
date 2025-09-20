const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export async function post(path, data) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {})
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw json?.message ? json : { message: r.statusText };
  return json;
}

export async function get(path, params = {}) {
  const q = new URLSearchParams(params);
  const url = `${API_BASE}${path}${q.toString() ? `?${q}` : ''}`;
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw json?.message ? json : { message: r.statusText };
  return json;
}
