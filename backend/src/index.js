import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import tilesRouter from './routes/tiles.js';
import dataRouter from './routes/data.js';
import settingsRouter from './routes/settings.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = join(__dirname, '../../frontend/dist');

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*'
}));
app.use(express.json());

app.use('/api/tiles', tilesRouter);
app.use('/api/data', dataRouter);
app.use('/api/settings', settingsRouter);

app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Serve built frontend — falls back gracefully if not yet built
if (existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  app.get('*', (req, res) => res.sendFile(join(STATIC_DIR, 'index.html')));
} else {
  app.get('/', (req, res) => res.send('Run "npm run build" in the frontend directory first.'));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Family Dashboard running on http://0.0.0.0:${PORT}`);
});
