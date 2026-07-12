import { useState, useEffect } from 'react';
import type { Tile, TileSchedule } from '../../types';
import { useDashboard } from '../../store';
import { randomUUID } from '../../utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const TILE_TYPES = ['clock', 'weather', 'news', 'countdown', 'calendar'] as const;
const FEED_COLORS = ['#38bdf8', '#4ade80', '#fb923c', '#f472b6', '#a78bfa', '#facc15'];

interface CalFeed { url: string; label: string; color: string; }

interface Props {
  tile?: Tile;
  onClose: () => void;
}

const DEFAULTS: Record<string, Partial<Tile>> = {
  clock:     { title: 'Clock',     config: {},                              layout: { x: 0, y: 0, w: 2, h: 2 } },
  weather:   { title: 'Weather',   config: { units: 'fahrenheit' },         layout: { x: 0, y: 0, w: 4, h: 2 } },
  news:      { title: 'News',      config: {},                              layout: { x: 0, y: 0, w: 3, h: 3 } },
  countdown: { title: 'Countdown', config: { label: 'Event', targetDate: '' }, layout: { x: 0, y: 0, w: 2, h: 2 } },
  calendar:  { title: 'Calendar',  config: { daysAhead: 14 },               layout: { x: 0, y: 0, w: 4, h: 4 } },
};

export default function TileEditor({ tile, onClose }: Props) {
  const { saveTile, deleteTile } = useDashboard();
  const isNew = !tile;
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState(tile?.type ?? 'clock');
  const [title, setTitle] = useState(tile?.title ?? '');
  const [enabled, setEnabled] = useState(tile?.enabled ?? true);
  const [schedule, setSchedule] = useState<TileSchedule>(tile?.schedule ?? { always: true });
  const [config, setConfig] = useState<Record<string, unknown>>(tile?.config ?? {});

  // Calendar feeds state
  const [calFeeds, setCalFeeds] = useState<CalFeed[]>([]);
  const [addingFeed, setAddingFeed] = useState(false);
  const [newFeed, setNewFeed] = useState<CalFeed>({ url: '', label: '', color: '#38bdf8' });

  useEffect(() => {
    if (type === 'calendar') {
      fetch('/api/settings/calendars')
        .then(r => r.ok ? r.json() : { feeds: [] })
        .then(d => {
          const feeds = d.feeds ?? [];
          setCalFeeds(feeds);
          setNewFeed(f => ({ ...f, color: FEED_COLORS[feeds.length % FEED_COLORS.length] }));
        });
    }
  }, [type]);

  function toggleDay(day: typeof DAYS[number]) {
    const days = schedule.days ?? [];
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    setSchedule(s => ({ ...s, days: next }));
  }

  function addFeed() {
    if (!newFeed.url.trim()) return;
    const updated = [...calFeeds, { ...newFeed }];
    setCalFeeds(updated);
    setNewFeed({ url: '', label: '', color: FEED_COLORS[updated.length % FEED_COLORS.length] });
    setAddingFeed(false);
  }

  async function handleSave() {
    setSaveError('');
    setSaving(true);
    try {
      // For calendar tiles, save feeds to global settings first
      if (type === 'calendar') {
        const res = await fetch('/api/settings/calendars', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feeds: calFeeds, daysAhead: Number(config.daysAhead ?? 14) })
        });
        if (!res.ok) throw new Error('Failed to save calendar feeds');
        await fetch('/api/data/calendar/refresh', { method: 'POST' });
      }

      const base = DEFAULTS[type] ?? {};
      const t: Tile = {
        id: tile?.id ?? randomUUID(),
        type,
        title: title || (base.title as string),
        config: { ...(base.config ?? {}), ...config },
        schedule,
        layout: tile?.layout ?? (base.layout as Tile['layout']),
        enabled
      };
      await saveTile(t);
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (tile && confirm(`Delete "${tile.title}"?`)) {
      await deleteTile(tile.id);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
      onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}>
      <div className="rounded-2xl p-6 flex flex-col gap-4 w-[420px] max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--color-surface)' }}>
        <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          {isNew ? 'Add Tile' : 'Edit Tile'}
        </div>

        {/* Type selector */}
        {isNew && (
          <Field label="Type">
            <div className="flex flex-wrap gap-2">
              {TILE_TYPES.map(t => (
                <button key={t} onClick={() => setType(t)}
                  className="px-3 py-1 rounded capitalize text-sm"
                  style={{ background: type === t ? 'var(--color-accent)' : 'var(--color-bg)', color: type === t ? '#fff' : 'var(--color-subtext)' }}>
                  {t}
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* Title */}
        <Field label="Title">
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder={DEFAULTS[type]?.title as string}
            className="w-full px-3 py-2 rounded text-sm"
            style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>

        {/* Countdown config */}
        {type === 'countdown' && (
          <>
            <Field label="Event Name">
              <input value={String(config.label ?? '')}
                onChange={e => setConfig(c => ({ ...c, label: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm"
                style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </Field>
            <Field label="Target Date">
              <input type="date" value={String(config.targetDate ?? '')}
                onChange={e => setConfig(c => ({ ...c, targetDate: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm"
                style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </Field>
          </>
        )}

        {/* Calendar config */}
        {type === 'calendar' && (
          <>
            <Field label="Calendar Feeds">
              {calFeeds.length === 0 && !addingFeed && (
                <p className="text-xs mb-2" style={{ color: 'var(--color-subtext)' }}>
                  No feeds yet. Get your iCal URL from Google Calendar → Settings → [Calendar name] → Integrate calendar → "Secret address in iCal format".
                </p>
              )}
              {calFeeds.map((feed, i) => (
                <div key={i} className="flex items-center gap-2 mb-2 p-2 rounded"
                  style={{ background: 'var(--color-bg)' }}>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: feed.color }} />
                  <span className="text-sm flex-1 truncate" style={{ color: 'var(--color-text)' }}>
                    {feed.label || 'Unlabeled'}
                  </span>
                  <span className="text-xs truncate max-w-[120px]" style={{ color: 'var(--color-subtext)' }}>
                    {feed.url ? '…' + feed.url.slice(-30) : 'No URL'}
                  </span>
                  <button onClick={() => setCalFeeds(f => f.filter((_, j) => j !== i))}
                    className="text-red-400 text-lg leading-none shrink-0 px-1">×</button>
                </div>
              ))}

              {addingFeed ? (
                <div className="flex flex-col gap-2 p-3 rounded" style={{ background: 'var(--color-bg)' }}>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={newFeed.color}
                      onChange={e => setNewFeed(f => ({ ...f, color: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border-0 shrink-0" />
                    <input placeholder="Label (e.g. Family, Mom)"
                      value={newFeed.label}
                      onChange={e => setNewFeed(f => ({ ...f, label: e.target.value }))}
                      className="flex-1 px-2 py-1.5 rounded text-sm"
                      style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <input placeholder="https://calendar.google.com/calendar/ical/..."
                    value={newFeed.url}
                    onChange={e => setNewFeed(f => ({ ...f, url: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded text-xs font-mono"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div className="flex gap-2">
                    <button onClick={addFeed}
                      className="flex-1 py-1.5 rounded text-sm font-medium text-white"
                      style={{ background: 'var(--color-accent)' }}>Add</button>
                    <button onClick={() => setAddingFeed(false)}
                      className="flex-1 py-1.5 rounded text-sm"
                      style={{ background: 'var(--color-surface)', color: 'var(--color-subtext)' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingFeed(true)}
                  className="w-full py-1.5 rounded text-sm mt-1"
                  style={{ background: 'var(--color-bg)', color: 'var(--color-subtext)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                  + Add Feed
                </button>
              )}
            </Field>

            <Field label="Days ahead to show">
              <input type="number" min={1} max={30} value={Number(config.daysAhead ?? 14)}
                onChange={e => setConfig(c => ({ ...c, daysAhead: Number(e.target.value) }))}
                className="w-24 px-3 py-2 rounded text-sm"
                style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </Field>
          </>
        )}

        {/* Schedule */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--color-subtext)' }}>Schedule</label>
          <label className="flex items-center gap-2 mb-2 cursor-pointer">
            <input type="checkbox" checked={schedule.always} onChange={e => setSchedule(s => ({ ...s, always: e.target.checked }))} />
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>Always show</span>
          </label>
          {!schedule.always && (
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--color-subtext)' }}>Days</div>
                <div className="flex gap-1 flex-wrap">
                  {DAYS.map(d => (
                    <button key={d} onClick={() => toggleDay(d)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: schedule.days?.includes(d) ? 'var(--color-accent)' : 'var(--color-bg)', color: schedule.days?.includes(d) ? '#fff' : 'var(--color-subtext)' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Field label="From">
                  <input type="time" value={schedule.timeStart ?? ''}
                    onChange={e => setSchedule(s => ({ ...s, timeStart: e.target.value }))}
                    className="px-2 py-1 rounded text-sm"
                    style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </Field>
                <Field label="To">
                  <input type="time" value={schedule.timeEnd ?? ''}
                    onChange={e => setSchedule(s => ({ ...s, timeEnd: e.target.value }))}
                    className="px-2 py-1 rounded text-sm"
                    style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* Enabled */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          <span className="text-sm" style={{ color: 'var(--color-text)' }}>Tile enabled</span>
        </label>

        {saveError && (
          <div className="text-sm text-red-400 px-1">{saveError}</div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 rounded font-semibold text-sm text-white disabled:opacity-50"
            style={{ background: 'var(--color-accent)' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={onClose}
            className="flex-1 py-2 rounded text-sm"
            style={{ background: 'var(--color-bg)', color: 'var(--color-subtext)' }}>
            Cancel
          </button>
          {!isNew && (
            <button onClick={handleDelete}
              className="px-4 py-2 rounded text-sm text-red-400"
              style={{ background: 'var(--color-bg)' }}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-subtext)' }}>{label}</label>
      {children}
    </div>
  );
}
