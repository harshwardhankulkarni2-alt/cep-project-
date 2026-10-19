import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

export default function AskFinsathi() {
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef();
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs, busy]);

  async function send(e) {
    e.preventDefault();
    const question = q.trim(); if (!question || busy) return;
    const history = msgs.filter((m) => !m.error);
    setMsgs([...msgs, { role: 'user', text: question }]); setQ(''); setBusy(true);
    try {
      const { answer } = await api('/ask', { method: 'POST', body: { question, history } });
      setMsgs((m) => [...m, { role: 'model', text: answer }]);
    } catch (x) { setMsgs((m) => [...m, { role: 'model', text: x.message, error: true }]); }
    finally { setBusy(false); }
  }
  return (
    <div className="chat">
      <div className="log">
        {msgs.length === 0 && <p className="empty">Ask about your spending, saving goals or money basics. Answers use the transactions you have added.</p>}
        {msgs.map((m, i) => <p key={i} className={`bubble ${m.role} ${m.error ? 'err' : ''}`}>{m.text}</p>)}
        {busy && <p className="bubble model muted">Thinking…</p>}
        <div ref={end} />
      </div>
      <form onSubmit={send}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Where am I spending the most?" aria-label="Your question" />
        <button className="primary" disabled={busy}>Ask</button>
      </form>
    </div>
  );
}
