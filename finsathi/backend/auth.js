import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from './db.js';

const sign = (u) => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email });

export function requireAuth(req, res, next) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.userId = jwt.verify(t, process.env.JWT_SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Please log in again.' }); }
}

const r = Router();
r.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 8)
    return res.status(400).json({ error: 'Enter a name, a valid email and a password of 8+ characters.' });
  const d = db.read();
  if (d.users.some((u) => u.email === email.toLowerCase())) return res.status(409).json({ error: 'This email is already registered.' });
  const u = { id: randomUUID(), name: name.trim(), email: email.toLowerCase(), hash: await bcrypt.hash(password, 10) };
  d.users.push(u); db.write(d);
  res.status(201).json({ token: sign(u), user: pub(u) });
});
r.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const u = db.read().users.find((x) => x.email === (email || '').toLowerCase());
  if (!u || !(await bcrypt.compare(password || '', u.hash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: sign(u), user: pub(u) });
});
r.get('/me', requireAuth, (req, res) => {
  const u = db.read().users.find((x) => x.id === req.userId);
  u ? res.json({ user: pub(u) }) : res.status(401).json({ error: 'Account not found.' });
});
export default r;
