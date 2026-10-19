import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { api, token } from './api.js';
import AuthPage from './components/AuthPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import AskFinsathi from './components/AskFinsathi.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!token.get());
  const [tab, setTab] = useState('money');

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
        <nav>
          <button className={tab === 'money' ? 'on' : ''} onClick={() => setTab('money')}>My money</button>
          <button className={tab === 'ask' ? 'on' : ''} onClick={() => setTab('ask')}>Ask Finsathi</button>
        </nav>
        <span className="muted who">{user.name}</span>
        <button className="ghost" onClick={logout} aria-label="Log out"><LogOut size={18} /></button>
      </header>
      <main>{tab === 'money' ? <Dashboard /> : <AskFinsathi />}</main>
    </div>
  );
}
