import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, save, nextId } from './db.js';
import { JWT_SECRET, authRequired, adminOnly } from './auth.js';

const router = Router();

function publicUser(u) {
  return { id: u.id, username: u.username, role: u.role };
}

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = getDb().users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: publicUser(user) });
});

router.get('/auth/me', authRequired, (req, res) => {
  res.json({ user: { id: req.user.sub, username: req.user.username, role: req.user.role } });
});

// ---- Usuarios (solo admin) ----
router.get('/users', authRequired, adminOnly, (req, res) => {
  res.json(getDb().users.map(publicUser));
});

router.post('/users', authRequired, adminOnly, (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password || !['admin', 'manager'].includes(role)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  if (getDb().users.some(u => u.username === username)) {
    return res.status(409).json({ error: 'El usuario ya existe' });
  }
  const user = { id: nextId(getDb().users), username, password: bcrypt.hashSync(password, 10), role };
  getDb().users.push(user);
  save();
  res.status(201).json(publicUser(user));
});

router.put('/users/:id', authRequired, adminOnly, (req, res) => {
  const user = getDb().users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { username, password, role } = req.body || {};
  if (username) user.username = username;
  if (role && ['admin', 'manager'].includes(role)) user.role = role;
  if (password) user.password = bcrypt.hashSync(password, 10);
  save();
  res.json(publicUser(user));
});

router.delete('/users/:id', authRequired, adminOnly, (req, res) => {
  const db = getDb();
  const idx = db.users.findIndex(u => u.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (db.users[idx].username === 'admin') return res.status(400).json({ error: 'No se puede eliminar el usuario admin' });
  db.users.splice(idx, 1);
  save();
  res.status(204).end();
});

// ---- Artistas (público lectura, admin escritura) ----
router.get('/artists', (req, res) => res.json(getDb().artists));

router.post('/artists', authRequired, adminOnly, (req, res) => {
  const { name, bio = '', image = '' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const artist = { id: nextId(getDb().artists), name, bio, image };
  getDb().artists.push(artist);
  save();
  res.status(201).json(artist);
});

router.put('/artists/:id', authRequired, adminOnly, (req, res) => {
  const artist = getDb().artists.find(a => a.id === Number(req.params.id));
  if (!artist) return res.status(404).json({ error: 'Artista no encontrado' });
  Object.assign(artist, req.body, { id: artist.id });
  save();
  res.json(artist);
});

router.delete('/artists/:id', authRequired, adminOnly, (req, res) => {
  const db = getDb();
  const idx = db.artists.findIndex(a => a.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Artista no encontrado' });
  db.artists.splice(idx, 1);
  save();
  res.status(204).end();
});

// ---- Portfolio (público lectura, admin escritura) ----
router.get('/portfolio', (req, res) => {
  let items = getDb().portfolio;
  if (req.query.artistId) items = items.filter(p => p.artistId === Number(req.query.artistId));
  res.json(items);
});

router.post('/portfolio', authRequired, adminOnly, (req, res) => {
  const { title, description = '', artistId = null, image = '' } = req.body || {};
  if (!title) return res.status(400).json({ error: 'El título es obligatorio' });
  const work = { id: nextId(getDb().portfolio), title, description, artistId, image };
  getDb().portfolio.push(work);
  save();
  res.status(201).json(work);
});

router.put('/portfolio/:id', authRequired, adminOnly, (req, res) => {
  const work = getDb().portfolio.find(p => p.id === Number(req.params.id));
  if (!work) return res.status(404).json({ error: 'Trabajo no encontrado' });
  Object.assign(work, req.body, { id: work.id });
  save();
  res.json(work);
});

router.delete('/portfolio/:id', authRequired, adminOnly, (req, res) => {
  const db = getDb();
  const idx = db.portfolio.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Trabajo no encontrado' });
  db.portfolio.splice(idx, 1);
  save();
  res.status(204).end();
});

// ---- Vídeos (público lectura, admin escritura) ----
router.get('/videos', (req, res) => res.json(getDb().videos));

router.post('/videos', authRequired, adminOnly, (req, res) => {
  const { title, url = '' } = req.body || {};
  if (!title) return res.status(400).json({ error: 'El título es obligatorio' });
  const video = { id: nextId(getDb().videos), title, url };
  getDb().videos.push(video);
  save();
  res.status(201).json(video);
});

router.put('/videos/:id', authRequired, adminOnly, (req, res) => {
  const video = getDb().videos.find(v => v.id === Number(req.params.id));
  if (!video) return res.status(404).json({ error: 'Vídeo no encontrado' });
  Object.assign(video, req.body, { id: video.id });
  save();
  res.json(video);
});

router.delete('/videos/:id', authRequired, adminOnly, (req, res) => {
  const db = getDb();
  const idx = db.videos.findIndex(v => v.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Vídeo no encontrado' });
  db.videos.splice(idx, 1);
  save();
  res.status(204).end();
});

// ---- Blog (público lectura, admin escritura) ----
router.get('/blog', (req, res) => res.json(getDb().blog));

router.get('/blog/:id', (req, res) => {
  const post = getDb().blog.find(b => b.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Artículo no encontrado' });
  res.json(post);
});

router.post('/blog', authRequired, adminOnly, (req, res) => {
  const { title, summary = '', content = '', date = new Date().toISOString().slice(0, 10) } = req.body || {};
  if (!title) return res.status(400).json({ error: 'El título es obligatorio' });
  const post = { id: nextId(getDb().blog), title, summary, content, date };
  getDb().blog.push(post);
  save();
  res.status(201).json(post);
});

router.put('/blog/:id', authRequired, adminOnly, (req, res) => {
  const post = getDb().blog.find(b => b.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Artículo no encontrado' });
  Object.assign(post, req.body, { id: post.id });
  save();
  res.json(post);
});

router.delete('/blog/:id', authRequired, adminOnly, (req, res) => {
  const db = getDb();
  const idx = db.blog.findIndex(b => b.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Artículo no encontrado' });
  db.blog.splice(idx, 1);
  save();
  res.status(204).end();
});

// ---- Solicitudes de cita (público crear, admin+manager leer/gestionar) ----
router.post('/requests', (req, res) => {
  const { name, email, phone, artist, style, bodyPart, size, idea, observations = '' } = req.body || {};
  if (!name || !email || !phone || !style || !bodyPart || !size || !idea) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const request = {
    id: nextId(getDb().requests),
    name, email, phone, artist, style, bodyPart, size, idea, observations,
    status: 'pendiente',
    createdAt: new Date().toISOString()
  };
  getDb().requests.push(request);
  save();
  res.status(201).json(request);
});

router.get('/requests', authRequired, (req, res) => {
  res.json(getDb().requests);
});

router.put('/requests/:id', authRequired, (req, res) => {
  const request = getDb().requests.find(r => r.id === Number(req.params.id));
  if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
  const { status } = req.body || {};
  if (status) request.status = status;
  save();
  res.json(request);
});

router.delete('/requests/:id', authRequired, adminOnly, (req, res) => {
  const db = getDb();
  const idx = db.requests.findIndex(r => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Solicitud no encontrada' });
  db.requests.splice(idx, 1);
  save();
  res.status(204).end();
});

// ---- Citas (admin y manager) ----
router.get('/appointments', authRequired, (req, res) => {
  res.json(getDb().appointments);
});

router.post('/appointments', authRequired, (req, res) => {
  const { clientName, clientEmail, clientPhone, artistName, style, date, time, notes = '', requestId = null } = req.body || {};
  if (!clientName || !artistName || !date || !time) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const appointment = {
    id: nextId(getDb().appointments),
    clientName, clientEmail, clientPhone, artistName, style, date, time, notes, requestId,
    status: 'confirmada',
    createdAt: new Date().toISOString()
  };
  getDb().appointments.push(appointment);
  if (requestId) {
    const request = getDb().requests.find(r => r.id === Number(requestId));
    if (request) request.status = 'aceptada';
  }
  save();
  res.status(201).json(appointment);
});

router.put('/appointments/:id', authRequired, (req, res) => {
  const appointment = getDb().appointments.find(a => a.id === Number(req.params.id));
  if (!appointment) return res.status(404).json({ error: 'Cita no encontrada' });
  Object.assign(appointment, req.body, { id: appointment.id });
  save();
  res.json(appointment);
});

router.delete('/appointments/:id', authRequired, (req, res) => {
  const db = getDb();
  const idx = db.appointments.findIndex(a => a.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Cita no encontrada' });
  db.appointments.splice(idx, 1);
  save();
  res.status(204).end();
});

export default router;
