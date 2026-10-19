export const token = {
  get: () => localStorage.getItem('fs_token'),
  set: (t) => localStorage.setItem('fs_token', t),
  clear: () => localStorage.removeItem('fs_token'),
};
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token.get() && { Authorization: `Bearer ${token.get()}` }) },
    body: body && JSON.stringify(body),
  });
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) token.clear();
    throw new Error(data.error || 'Something went wrong. Try again.');
  }
  return data;
}
