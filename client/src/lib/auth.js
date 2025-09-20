const KEY = 'auth';
export function saveAuth(a){ localStorage.setItem(KEY, JSON.stringify(a)); }
export function getAuth(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch{ return null; } }
export function clearAuth(){ localStorage.removeItem(KEY); }
