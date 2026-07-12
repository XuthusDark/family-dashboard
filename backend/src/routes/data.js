import { Router } from 'express';
import { fetchWeather } from '../services/weather.js';
import { fetchNews } from '../services/news.js';

const router = Router();

router.get('/weather', async (req, res) => {
  try {
    res.json(await fetchWeather());
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get('/news', async (req, res) => {
  try {
    res.json(await fetchNews());
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

export default router;
