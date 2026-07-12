import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function ClockTile() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full select-none">
      <div className="text-5xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text)' }}>
        {format(now, 'h:mm')}
        <span className="text-3xl font-normal opacity-60">{format(now, ':ss')}</span>
      </div>
      <div className="text-lg mt-1 font-medium" style={{ color: 'var(--color-subtext)' }}>
        {format(now, 'h:mm a')}
      </div>
      <div className="text-base mt-2 font-medium" style={{ color: 'var(--color-subtext)' }}>
        {format(now, 'EEEE, MMMM d')}
      </div>
    </div>
  );
}
