import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'db.json');

function seed() {
  return {
    users: [
      {
        id: 1,
        username: 'admin',
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin'
      },
      {
        id: 2,
        username: 'manager',
        password: bcrypt.hashSync('manager123', 10),
        role: 'manager'
      }
    ],
    artists: [
      { id: 1, name: 'Nick', bio: 'Especialista en blackwork y lettering.', image: '' },
      { id: 2, name: 'Alba', bio: 'Fineline y floral.', image: '' },
      { id: 3, name: 'Alex', bio: 'Realismo y sombra.', image: '' },
      { id: 4, name: 'Zaira', bio: 'Acuarela y color.', image: '' },
      { id: 5, name: 'Carla', bio: 'Neotradicional.', image: '' },
      { id: 6, name: 'Gaby', bio: 'Geométrico y puntillismo.', image: '' }
    ],
    portfolio: [
      { id: 1, title: 'Trabajo de ejemplo 1', description: 'Aquí aparecerá la fotografía del tatuaje y su descripción.', artistId: 1, image: '' },
      { id: 2, title: 'Trabajo de ejemplo 2', description: 'Aquí aparecerá la fotografía del tatuaje y su descripción.', artistId: 2, image: '' },
      { id: 3, title: 'Trabajo de ejemplo 3', description: 'Aquí aparecerá la fotografía del tatuaje y su descripción.', artistId: 5, image: '' }
    ],
    videos: [
      { id: 1, title: 'Vídeo de ejemplo', url: '' }
    ],
    blog: [
      { id: 1, title: 'Artículo de ejemplo', summary: 'Resumen del artículo que se publicará en el blog.', content: 'Contenido del artículo de ejemplo.', date: new Date().toISOString().slice(0, 10) },
      { id: 2, title: 'Otra publicación', summary: 'Resumen de otra publicación del estudio.', content: 'Contenido de otra publicación.', date: new Date().toISOString().slice(0, 10) }
    ],
    requests: [],
    appointments: []
  };
}

let db;

export function loadDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    db = migrate(db);
  } else {
    db = seed();
    save();
  }
  return db;
}

function migrate(db) {
  const base = seed();
  for (const key of Object.keys(base)) {
    if (!db[key]) db[key] = base[key];
  }
  const hasSeedUsers = db.users.some(u => ['admin', 'manager'].includes(u.username));
  if (!hasSeedUsers) {
    db.users.push(...base.users.filter(u => ['admin', 'manager'].includes(u.username)));
  }
  save();
  return db;
}

export function save() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export function getDb() {
  if (!db) loadDb();
  return db;
}

export function nextId(items) {
  return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
}
