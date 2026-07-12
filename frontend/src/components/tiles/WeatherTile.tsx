import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { WeatherData } from '../../types';

type View = 'current' | 'hourly' | 'daily';

export default function WeatherTile() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [view, setView] = useState<View>('current');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/data/weather');
        if (!res.ok) throw new Error('Failed');
        setData(await res.json());
      } catch {
        setError('Weather unavailable');
      }
    }
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (error) return <div className="flex items-center justify-center h-full text-sm opacity-50">{error}</div>;
  if (!data) return <div className="flex items-center justify-center h-full text-sm opacity-50">Loading…</div>;

  const { current, hourly, daily } = data;

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-1 mb-2 shrink-0">
        {(['current', 'hourly', 'daily'] as View[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1 rounded text-xs font-medium capitalize transition-colors"
            style={{
              background: view === v ? 'var(--color-accent)' : 'var(--color-surface)',
              color: view === v ? '#fff' : 'var(--color-subtext)'
            }}
          >
            {v}
            {v === 'hourly' && data.precipComing && ' 🌧️'}
          </button>
        ))}
        <span className="ml-auto text-xs self-center opacity-40">{data.location}</span>
      </div>

      {view === 'current' && (
        <div className="flex items-center gap-4 flex-1 min-h-0">
          <div className="text-6xl shrink-0">{current.icon}</div>
          <div>
            <div className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>
              {current.temp}°
            </div>
            <div className="text-sm" style={{ color: 'var(--color-subtext)' }}>
              Feels like {current.feelsLike}°
            </div>
            <div className="text-sm font-medium mt-1" style={{ color: 'var(--color-text)' }}>
              {current.label}
            </div>
            <div className="text-xs mt-1 space-x-3" style={{ color: 'var(--color-subtext)' }}>
              <span>💧 {current.humidity}%</span>
              <span>💨 {current.wind} mph</span>
            </div>
          </div>
          <div className="ml-auto flex flex-col gap-1">
            {daily.slice(0, 4).map(d => (
              <div key={d.date} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-subtext)' }}>
                <span className="w-8">{format(parseISO(d.date), 'EEE')}</span>
                <span>{d.icon}</span>
                <span style={{ color: 'var(--color-text)' }}>{d.high}°</span>
                <span className="opacity-50">{d.low}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'hourly' && (
        <div className="flex gap-2 overflow-x-auto flex-1 min-h-0 pb-1">
          {hourly.slice(0, 12).map(h => (
            <div
              key={h.time}
              className="flex flex-col items-center gap-1 shrink-0 px-2 py-1 rounded"
              style={{ background: 'var(--color-surface)', minWidth: '3.5rem' }}
            >
              <span className="text-xs" style={{ color: 'var(--color-subtext)' }}>
                {format(parseISO(h.time), 'ha')}
              </span>
              <span className="text-xl">{h.icon}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{h.temp}°</span>
              {h.precipProb > 10 && (
                <span className="text-xs" style={{ color: 'var(--color-accent)' }}>{h.precipProb}%</span>
              )}
            </div>
          ))}
        </div>
      )}

      {view === 'daily' && (
        <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
          {daily.map(d => (
            <div
              key={d.date}
              className="flex items-center gap-3 px-2 py-1 rounded"
              style={{ background: 'var(--color-surface)' }}
            >
              <span className="text-sm w-12 font-medium" style={{ color: 'var(--color-text)' }}>
                {format(parseISO(d.date), 'EEE')}
              </span>
              <span className="text-lg">{d.icon}</span>
              <span className="text-xs flex-1 truncate" style={{ color: 'var(--color-subtext)' }}>{d.label}</span>
              {d.precipProb > 10 && (
                <span className="text-xs" style={{ color: 'var(--color-accent)' }}>{d.precipProb}%</span>
              )}
              <span className="text-sm font-bold ml-auto" style={{ color: 'var(--color-text)' }}>{d.high}°</span>
              <span className="text-sm opacity-50" style={{ color: 'var(--color-text)' }}>{d.low}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
