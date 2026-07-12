import { Router } from 'express';
import { fetchWeather } from '../services/weather.js';
import { fetchNews } from '../services/news.js';
import { fetchCalendar, clearCalendarCache } from '../services/calendar.js';
import { getSetting } from '../db/index.js';

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

router.get('/calendar', async (req, res) => {
  try {
    const cfg = getSetting('calendars') ?? { feeds: [], daysAhead: 14 };
    res.json(await fetchCalendar(cfg.feeds, cfg.daysAhead));
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.post('/calendar/refresh', (req, res) => {
  clearCalendarCache();
  res.json({ ok: true });
});

export default router;
