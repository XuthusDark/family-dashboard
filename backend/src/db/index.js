import { createHash, randomUUID } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');
const DB_PATH = join(DATA_DIR, 'dashboard.json');

mkdirSync(DATA_DIR, { recursive: true });

function defaultDb() {
  return {
    tiles: [
      { id: 'clock-1',     type: 'clock',     title: 'Clock',    config: {},                                              schedule: { always: true }, layout: { x: 0, y: 0, w: 2, h: 2 }, enabled: true, sort_order: 0 },
      { id: 'weather-1',   type: 'weather',   title: 'Weather',  config: { units: 'fahrenheit' },                         schedule: { always: true }, layout: { x: 2, y: 0, w: 4, h: 2 }, enabled: true, sort_order: 1 },
      { id: 'news-1',      type: 'news',      title: 'AP News',  config: {},                                              schedule: { always: true }, layout: { x: 0, y: 2, w: 3, h: 3 }, enabled: true, sort_order: 2 },
      { id: 'countdown-1', type: 'countdown', title: 'Countdown', config: { label: 'Christmas', targetDate: '2026-12-25' }, schedule: { always: true }, layout: { x: 3, y: 2, w: 3, h: 2 }, enabled: true, sort_order: 3 }
    ],
    settings: {
      theme: {
        mode: 'dark',
        dark:  { bg: '#0f172a', surface: '#1e293b', accent: '#38bdf8', text: '#f1f5f9', subtext: '#94a3b8' },
        light: { bg: '#f8fafc', surface: '#ffffff', accent: '#0284c7', text: '#0f172a', subtext: '#64748b' }
      },
      night_mode: {
        enabled: true,
        start: '22:00',
        end: '07:00',
        dimLevel: 0.05
      },
      news_feed: {
        url: 'https://feeds.apnews.com/rss/apf-topnews',
        maxItems: 8
      },
      location: {
        lat: 40.7128,
        lon: -74.0060,
        timezone: 'America/New_York',
        label: 'Home'
      }
    }
  };
}

function load() {
  if (!existsSync(DB_PATH)) return defaultDb();
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf8'));
  } catch {
    return defaultDb();
  }
}

function save(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export function getAllTiles() {
  return load().tiles.sort((a, b) => a.sort_order - b.sort_order);
}

export function upsertTile(tile) {
  const db = load();
  const idx = db.tiles.findIndex(t => t.id === tile.id);
  if (idx >= 0) {
    db.tiles[idx] = { ...db.tiles[idx], ...tile };
  } else {
    const maxOrder = db.tiles.reduce((m, t) => Math.max(m, t.sort_order ?? 0), 0);
    db.tiles.push({ sort_order: maxOrder + 1, ...tile, id: tile.id ?? randomUUID() });
  }
  save(db);
}

export function deleteTile(id) {
  const db = load();
  db.tiles = db.tiles.filter(t => t.id !== id);
  save(db);
}

export function updateLayouts(layouts) {
  const db = load();
  for (const { id, layout } of layouts) {
    const tile = db.tiles.find(t => t.id === id);
    if (tile) tile.layout = layout;
  }
  save(db);
}

export function getSetting(key) {
  return load().settings[key] ?? null;
}

export function setSetting(key, value) {
  const db = load();
  db.settings[key] = value;
  save(db);
}

export function checkPin(pin) {
  const stored = getSetting('admin_pin');
  if (!stored) return false;
  const hash = createHash('sha256').update(pin).digest('hex');
  return stored === hash;
}

export function setPin(pin) {
  setSetting('admin_pin', createHash('sha256').update(pin).digest('hex'));
}
