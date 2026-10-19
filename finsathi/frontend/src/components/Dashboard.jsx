import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api.js';

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
const blank = () => ({ type: 'expense', amount: '', category: '', note: '', date: new Date().toISOString().slice(0, 10) });

export default function Dashboard() {
  const [txs, setTxs] = useState(null);
  const [f, setF] = useState(blank());
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { api('/transactions').then(setTxs).catch((e) => { setErr(e.message); setTxs([]); }); }, []);

  const { income, expense, cats } = useMemo(() => {
    const l = txs || [], by = {};
    l.filter((t) => t.type === 'expense').forEach((t) => (by[t.category] = (by[t.category] || 0) + t.amount));
    return {
      income: l.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: l.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      cats: Object.entries(by).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    };
  }, [txs]);

  async function add(e) {
    e.preventDefault(); setErr('');
    try { const t = await api('/transactions', { method: 'POST', body: f }); setTxs([t, ...txs]); setF(blank()); }
    catch (x) { setErr(x.message); }
  }
  async function del(id) { await api(`/transactions/${id}`, { method: 'DELETE' }); setTxs(txs.filter((t) => t.id !== id)); }

  if (!txs) return <p className="muted">Loading your transactions…</p>;
  return (
    <>
      <section className="totals">
        <div><span className="muted">Income</span><b className="in">{inr(income)}</b></div>
        <div><span className="muted">Spent</span><b className="out">{inr(expense)}</b></div>
        <div><span className="muted">Left</span><b>{inr(income - expense)}</b></div>
      </section>

      <form className="add" onSubmit={add}>
        <select value={f.type} onChange={set('type')} aria-label="Type"><option value="expense">Expense</option><option value="income">Income</option></select>
        <input type="number" min="1" step="any" placeholder="Amount (₹)" value={f.amount} onChange={set('amount')} required />
        <input placeholder="Category, e.g. Rent" value={f.category} onChange={set('category')} required />
        <input placeholder="Note (optional)" value={f.note} onChange={set('note')} />
        <input type="date" value={f.date} onChange={set('date')} required />
        <button className="primary">Add</button>
      </form>
      {err && <p className="err" role="alert">{err}</p>}

      {txs.length === 0 ? (
        <p className="empty">Nothing here yet. Add your first income or expense above and your spending chart will appear.</p>
      ) : (
        <>
          <h2>Spending by category</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cats}><XAxis dataKey="name" /><YAxis width={60} /><Tooltip formatter={inr} />
                <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
          <h2>Transactions</h2>
          <ul className="list">
            {txs.map((t) => (
              <li key={t.id}>
                <span><b>{t.category}</b> <span className="muted">{t.note} · {t.date}</span></span>
                <span className={t.type === 'income' ? 'in' : 'out'}>{t.type === 'income' ? '+' : '−'}{inr(t.amount)}</span>
                <button className="ghost" onClick={() => del(t.id)} aria-label={`Delete ${t.category}`}><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
