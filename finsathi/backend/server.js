import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import { db } from './db.js';
import authRouter, { requireAuth } from './auth.js';
import { ai } from './genkit.js';

for (const k of ['JWT_SECRET', 'GEMINI_API_KEY'])
  if (!process.env[k]) { console.error(`Missing ${k} in .env`); process.exit(1); }

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }), authRouter);

// ---- Transactions (per user) ----
const mine = (id) => db.read().transactions.filter((t) => t.userId === id);
app.get('/api/transactions', requireAuth, (req, res) =>
  res.json(mine(req.userId).sort((a, b) => b.date.localeCompare(a.date))));
app.post('/api/transactions', requireAuth, (req, res) => {
  const { type, amount, category, note = '', date } = req.body || {};
  if (!['income', 'expense'].includes(type) || !(Number(amount) > 0) || !category?.trim() || !date)
    return res.status(400).json({ error: 'Type, amount, category and date are required.' });
  const d = db.read();
  const t = { id: randomUUID(), userId: req.userId, type, amount: Number(amount), category: category.trim(), note: note.trim(), date };
  d.transactions.push(t); db.write(d);
  res.status(201).json(t);
});
app.delete('/api/transactions/:id', requireAuth, (req, res) => {
  const d = db.read();
  d.transactions = d.transactions.filter((t) => !(t.id === req.params.id && t.userId === req.userId));
  db.write(d); res.status(204).end();
});

// ---- Ask Finsathi (Genkit + Gemini) ----
app.post('/api/ask', requireAuth, rateLimit({ windowMs: 60 * 1000, max: 15 }), async (req, res) => {
  const { question, history = [] } = req.body || {};
  if (!question?.trim()) return res.status(400).json({ error: 'Type a question first.' });
  const txs = mine(req.userId);
  const sum = (t) => txs.filter((x) => x.type === t).reduce((s, x) => s + x.amount, 0);
  const byCat = {};
  txs.filter((x) => x.type === 'expense').forEach((x) => (byCat[x.category] = (byCat[x.category] || 0) + x.amount));
  const context = txs.length
    ? `Income ₹${sum('income')}, expenses ₹${sum('expense')}. Expenses by category: ${JSON.stringify(byCat)}. Recent: ${JSON.stringify(txs.slice(-20).map(({ type, amount, category, date }) => ({ type, amount, category, date })))}`
    : 'The user has not added any transactions yet.';
  try {
    const { text } = await ai.generate({
      system: `You are Finsathi, a friendly personal-finance guide for people in India. Use ₹. Ground answers in the user's data below and say so when data is missing. Give educational guidance, not regulated investment advice. Keep answers short.\nUser data: ${context}`,
      messages: history.slice(-10).map((m) => ({ role: m.role === 'user' ? 'user' : 'model', content: [{ text: String(m.text) }] })),
      prompt: question,
    });
    res.json({ answer: text });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'Ask Finsathi is unavailable right now. Check the GEMINI_API_KEY and try again.' });
  }
});

app.listen(process.env.PORT || 5000, () => console.log('Finsathi API running'));
