import { useEffect, useState } from 'react';
import { differenceInDays, format, parseISO, isPast } from 'date-fns';

interface Props {
  config: { label?: string; targetDate?: string };
}

export default function CountdownTile({ config }: Props) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const label = config.label || 'Event';
  const targetDate = config.targetDate ? parseISO(config.targetDate) : null;

  if (!targetDate) {
    return (
      <div className="flex items-center justify-center h-full text-sm opacity-50">
        No date set
      </div>
    );
  }

  const days = differenceInDays(targetDate, now);
  const past = isPast(targetDate);

  return (
    <div className="flex flex-col items-center justify-center h-full select-none gap-1">
      <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-subtext)' }}>
        {past ? 'Since' : 'Until'}
      </div>
      <div className="text-xl font-bold text-center leading-tight" style={{ color: 'var(--color-text)' }}>
        {label}
      </div>
      <div
        className="text-6xl font-black tabular-nums leading-none mt-1"
        style={{ color: 'var(--color-accent)' }}
      >
        {Math.abs(days)}
      </div>
      <div className="text-sm" style={{ color: 'var(--color-subtext)' }}>
        {Math.abs(days) === 1 ? 'day' : 'days'}
      </div>
      <div className="text-xs mt-1 opacity-40" style={{ color: 'var(--color-subtext)' }}>
        {format(targetDate, 'MMMM d, yyyy')}
      </div>
    </div>
  );
}
