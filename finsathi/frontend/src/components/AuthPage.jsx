import { useState } from 'react';
import { api } from '../api.js';

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try { onAuth(await api(`/auth/${mode}`, { method: 'POST', body: f })); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  return (
    <div className="auth">
      <h1>Finsathi</h1>
      <p className="muted">Track what you earn and spend, then ask questions in plain language.</p>
      <form onSubmit={submit}>
        {mode === 'register' && <label>Name<input value={f.name} onChange={set('name')} required /></label>}
        <label>Email<input type="email" value={f.email} onChange={set('email')} required /></label>
        <label>Password<input type="password" minLength={8} value={f.password} onChange={set('password')} required /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
      </form>
      <button className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
        {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
      </button>
    </div>
  );
}
