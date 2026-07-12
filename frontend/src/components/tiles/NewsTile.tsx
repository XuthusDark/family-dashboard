import { useEffect, useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { NewsData } from '../../types';

export default function NewsTile() {
  const [data, setData] = useState<NewsData | null>(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/data/news');
        if (!res.ok) throw new Error('Failed');
        setData(await res.json());
      } catch {
        setError('News unavailable');
      }
    }
    load();
    const id = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (error) return <div className="flex items-center justify-center h-full text-sm opacity-50">{error}</div>;
  if (!data) return <div className="flex items-center justify-center h-full text-sm opacity-50">Loading…</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-semibold uppercase tracking-wider mb-2 shrink-0" style={{ color: 'var(--color-subtext)' }}>
        {data.title}
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {data.items.map((item, i) => (
          <button
            key={i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="text-left p-2 rounded transition-colors"
            style={{ background: expanded === i ? 'var(--color-surface)' : 'transparent' }}
          >
            <div className="text-sm font-medium leading-snug" style={{ color: 'var(--color-text)' }}>
              {item.title}
            </div>
            {expanded === i && item.summary && (
              <div className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-subtext)' }}>
                {item.summary.slice(0, 200)}{item.summary.length > 200 ? '…' : ''}
              </div>
            )}
            <div className="text-xs mt-0.5 opacity-40" style={{ color: 'var(--color-subtext)' }}>
              {item.pubDate ? formatDistanceToNow(parseISO(item.pubDate), { addSuffix: true }) : ''}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
