import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tilesRouter from './routes/tiles.js';
import dataRouter from './routes/data.js';
import settingsRouter from './routes/settings.js';

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Family Dashboard backend running on port ${PORT}`);
});
