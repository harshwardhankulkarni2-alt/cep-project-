import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { api, token } from './api.js';
import AuthPage from './components/AuthPage.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!token.get());

  useEffect(() => {
    if (token.get()) api('/auth/me').then((d) => setUser(d.user)).catch(() => {}).finally(() => setReady(true));
  }, []);

  const logout = () => { token.clear(); setUser(null); };
  if (!ready) return <p className="muted center">Loading…</p>;
  if (!user) return <AuthPage onAuth={(d) => { token.set(d.token); setUser(d.user); }} />;

  return (
    <div className="shell">
      <header>
        <h1>Finsathi</h1>
        <nav />
        <span className="muted who">{user.name}</span>
        <button className="ghost" onClick={logout} aria-label="Log out"><LogOut size={18} /></button>
      </header>
      <main><Dashboard /></main>
    </div>
  );
}