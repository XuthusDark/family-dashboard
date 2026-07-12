import { useState, useEffect } from 'react';
import { useDashboard } from '../../store';
import TileEditor from './TileEditor';
import type { Tile, Theme } from '../../types';

interface CalFeed { url: string; label: string; color: string; }

const FEED_COLORS = ['#38bdf8','#4ade80','#fb923c','#f472b6','#a78bfa','#facc15'];

const PRESET_THEMES: { name: string; dark: Theme['dark']; light: Theme['light'] }[] = [
  {
    name: 'Slate',
    dark:  { bg: '#0f172a', surface: '#1e293b', accent: '#38bdf8', text: '#f1f5f9', subtext: '#94a3b8' },
    light: { bg: '#f8fafc', surface: '#ffffff', accent: '#0284c7', text: '#0f172a', subtext: '#64748b' }
  },
  {
    name: 'Forest',
    dark:  { bg: '#0a1a0f', surface: '#14291a', accent: '#4ade80', text: '#f0fdf4', subtext: '#86efac' },
    light: { bg: '#f0fdf4', surface: '#ffffff', accent: '#16a34a', text: '#14532d', subtext: '#4ade80' }
  },
  {
    name: 'Amber',
    dark:  { bg: '#1c1200', surface: '#2a1c00', accent: '#fbbf24', text: '#fffbeb', subtext: '#fcd34d' },
    light: { bg: '#fffbeb', surface: '#ffffff', accent: '#d97706', text: '#451a03', subtext: '#92400e' }
  },
  {
    name: 'Purple',
    dark:  { bg: '#0f0a1e', surface: '#1a1233', accent: '#a78bfa', text: '#f5f3ff', subtext: '#c4b5fd' },
    light: { bg: '#faf5ff', surface: '#ffffff', accent: '#7c3aed', text: '#2e1065', subtext: '#6d28d9' }
  },
  {
    name: 'Rose',
    dark:  { bg: '#1a0a0f', surface: '#2a1020', accent: '#fb7185', text: '#fff1f2', subtext: '#fda4af' },
    light: { bg: '#fff1f2', surface: '#ffffff', accent: '#e11d48', text: '#4c0519', subtext: '#9f1239' }
  }
];

interface Props {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: Props) {
  const { tiles, theme, nightMode, setTheme, setNightMode, setAdminUnlocked } = useDashboard();
  const [editingTile, setEditingTile] = useState<Tile | null | 'new'>(null);
  const [tab, setTab] = useState<'tiles' | 'feeds' | 'theme' | 'display'>('tiles');
  const [calFeeds, setCalFeeds] = useState<CalFeed[]>([]);
  const [feedsSaved, setFeedsSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings/calendars')
      .then(r => r.ok ? r.json() : { feeds: [] })
      .then(d => setCalFeeds(d.feeds ?? []));
  }, []);

  async function saveFeeds() {
    await fetch('/api/settings/calendars', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feeds: calFeeds, daysAhead: 14 })
    });
    await fetch('/api/data/calendar/refresh', { method: 'POST' });
    setFeedsSaved(true);
    setTimeout(() => setFeedsSaved(false), 2000);
  }

  function addFeed() {
    setCalFeeds(f => [...f, { url: '', label: '', color: FEED_COLORS[f.length % FEED_COLORS.length] }]);
  }

  function closeAndLock() {
    setAdminUnlocked(false);
    onClose();
  }

  if (editingTile !== null) {
    return (
      <TileEditor
        tile={editingTile === 'new' ? undefined : editingTile}
        onClose={() => setEditingTile(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-2xl flex flex-col w-[480px] max-h-[80vh]" style={{ background: 'var(--color-surface)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Dashboard Admin</div>
          <button onClick={closeAndLock} className="text-2xl leading-none opacity-50 hover:opacity-80" style={{ color: 'var(--color-text)' }}>×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 shrink-0 flex-wrap">
          {(['tiles', 'feeds', 'theme', 'display'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded capitalize text-sm font-medium"
              style={{ background: tab === t ? 'var(--color-accent)' : 'var(--color-bg)', color: tab === t ? '#fff' : 'var(--color-subtext)' }}>
              {t}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {tab === 'tiles' && (
            <div className="flex flex-col gap-2">
              {tiles.map(tile => (
                <button key={tile.id} onClick={() => setEditingTile(tile)}
                  className="flex items-center gap-3 px-3 py-2 rounded text-left"
                  style={{ background: 'var(--color-bg)' }}>
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-text)' }}>{tile.title}</span>
                  <span className="text-xs capitalize" style={{ color: 'var(--color-subtext)' }}>{tile.type}</span>
                  <span className="text-xs" style={{ color: tile.enabled ? 'var(--color-accent)' : 'var(--color-subtext)' }}>
                    {tile.enabled ? '●' : '○'}
                  </span>
                  <span className="text-xs opacity-40" style={{ color: 'var(--color-subtext)' }}>
                    {tile.schedule.always ? 'always' : 'scheduled'}
                  </span>
                </button>
              ))}
              <button onClick={() => setEditingTile('new')}
                className="mt-2 py-2 rounded text-sm font-semibold text-white"
                style={{ background: 'var(--color-accent)' }}>
                + Add Tile
              </button>
            </div>
          )}

          {tab === 'feeds' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-subtext)' }}>
                Add Google Calendar iCal URLs. In Google Calendar: Settings → [Calendar name] → Integrate calendar → "Secret address in iCal format".
              </p>
              {calFeeds.map((feed, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded" style={{ background: 'var(--color-bg)' }}>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={feed.color}
                      onChange={e => setCalFeeds(f => f.map((x, j) => j === i ? { ...x, color: e.target.value } : x))}
                      className="w-8 h-8 rounded cursor-pointer border-0 shrink-0" />
                    <input
                      placeholder="Label (e.g. Mom, Family)"
                      value={feed.label}
                      onChange={e => setCalFeeds(f => f.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                      className="flex-1 px-2 py-1.5 rounded text-sm"
                      style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button onClick={() => setCalFeeds(f => f.filter((_, j) => j !== i))}
                      className="text-red-400 text-lg leading-none px-1">×</button>
                  </div>
                  <input
                    placeholder="https://calendar.google.com/calendar/ical/..."
                    value={feed.url}
                    onChange={e => setCalFeeds(f => f.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                    className="w-full px-2 py-1.5 rounded text-xs font-mono"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ))}
              <button onClick={addFeed}
                className="py-2 rounded text-sm"
                style={{ background: 'var(--color-surface)', color: 'var(--color-subtext)' }}>
                + Add Calendar
              </button>
              <button onClick={saveFeeds}
                className="py-2 rounded text-sm font-semibold text-white"
                style={{ background: feedsSaved ? '#4ade80' : 'var(--color-accent)' }}>
                {feedsSaved ? '✓ Saved' : 'Save & Refresh'}
              </button>
            </div>
          )}

          {tab === 'theme' && theme && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                {(['dark', 'light'] as const).map(m => (
                  <button key={m} onClick={() => setTheme({ ...theme, mode: m })}
                    className="flex-1 py-2 rounded capitalize text-sm font-medium"
                    style={{ background: theme.mode === m ? 'var(--color-accent)' : 'var(--color-bg)', color: theme.mode === m ? '#fff' : 'var(--color-subtext)' }}>
                    {m === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                ))}
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-subtext)' }}>Presets</div>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_THEMES.map(preset => (
                    <button key={preset.name}
                      onClick={() => setTheme({ ...theme, dark: preset.dark, light: preset.light })}
                      className="flex flex-col items-center gap-1 p-2 rounded"
                      style={{ background: 'var(--color-bg)' }}>
                      <div className="w-8 h-8 rounded-full border-2" style={{ background: preset.dark.accent, borderColor: preset.dark.surface }} />
                      <span className="text-xs" style={{ color: 'var(--color-subtext)' }}>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-subtext)' }}>
                  Custom ({theme.mode})
                </div>
                {(Object.keys(theme[theme.mode]) as (keyof typeof theme['dark'])[]).map(key => (
                  <div key={key} className="flex items-center gap-3 mb-2">
                    <label className="text-sm w-20 capitalize" style={{ color: 'var(--color-text)' }}>{key}</label>
                    <input
                      type="color"
                      value={theme[theme.mode][key]}
                      onChange={e => setTheme({ ...theme, [theme.mode]: { ...theme[theme.mode], [key]: e.target.value } })}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <span className="text-xs font-mono" style={{ color: 'var(--color-subtext)' }}>{theme[theme.mode][key]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'display' && nightMode && (
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={nightMode.enabled}
                  onChange={e => setNightMode({ ...nightMode, enabled: e.target.checked })} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Night dim mode</span>
              </label>
              {nightMode.enabled && (
                <>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--color-subtext)' }}>Dim at</label>
                      <input type="time" value={nightMode.start}
                        onChange={e => setNightMode({ ...nightMode, start: e.target.value })}
                        className="px-3 py-2 rounded text-sm"
                        style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--color-subtext)' }}>Brighten at</label>
                      <input type="time" value={nightMode.end}
                        onChange={e => setNightMode({ ...nightMode, end: e.target.value })}
                        className="px-3 py-2 rounded text-sm"
                        style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--color-subtext)' }}>
                      Dim level: {Math.round(nightMode.dimLevel * 100)}%
                    </label>
                    <input type="range" min={1} max={30} value={Math.round(nightMode.dimLevel * 100)}
                      onChange={e => setNightMode({ ...nightMode, dimLevel: Number(e.target.value) / 100 })}
                      className="w-full" />
                    <div className="text-xs mt-1" style={{ color: 'var(--color-subtext)' }}>Percentage of full brightness</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
