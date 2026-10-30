import express from 'express';
import cors from 'cors';
import { loadDb } from './db.js';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api', routes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

loadDb();
app.listen(PORT, () => {
  console.log(`API RealBlack Tattoo escuchando en http://localhost:${PORT}/api`);
});
