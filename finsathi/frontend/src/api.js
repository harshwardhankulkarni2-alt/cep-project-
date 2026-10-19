const BASE = import.meta.env.VITE_API_URL || '';

export const token = {
  get: () => localStorage.getItem('fs_token'),
  set: (t) => localStorage.setItem('fs_token', t),
  clear: () => localStorage.removeItem('fs_token'),
};

export async function api(path, { method = 'GET', body } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    const res = await fetch(BASE + '/api' + path, {
      method,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(token.get() && { Authorization: `Bearer ${token.get()}` }) },
      body: body && JSON.stringify(body),
    });
    const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) token.clear();
      throw new Error(data.error || 'Something went wrong. Try again.');
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('The server is waking up. Wait a moment and try again.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}