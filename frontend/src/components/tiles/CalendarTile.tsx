import { useEffect, useState } from 'react';
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay, isSameDay } from 'date-fns';

interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  calLabel: string | null;
  calColor: string;
}

interface CalData {
  events: CalEvent[];
  updatedAt: string;
}

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMM d');
}

function groupByDay(events: CalEvent[], daysAhead: number): { date: Date; events: CalEvent[] }[] {
  const days: { date: Date; events: CalEvent[] }[] = [];
  const today = startOfDay(new Date());

  for (let i = 0; i < daysAhead; i++) {
    const date = addDays(today, i);
    const dayEvents = events.filter(e => isSameDay(parseISO(e.start), date));
    if (dayEvents.length > 0 || i < 3) {
      days.push({ date, events: dayEvents });
    }
  }
  return days.slice(0, 7);
}

export default function CalendarTile() {
  const [data, setData] = useState<CalData | null>(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const res = await fetch('/api/data/calendar');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Calendar unavailable');
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-sm opacity-50">
      <span>📅</span>
      <span>{error}</span>
      <span className="text-xs opacity-60">Add a calendar feed in Admin → Tiles</span>
    </div>
  );
  if (!data) return <div className="flex items-center justify-center h-full text-sm opacity-50">Loading…</div>;

  const days = groupByDay(data.events, 14);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-subtext)' }}>
          Calendar
        </div>
        <div className="text-xs" style={{ color: 'var(--color-subtext)' }}>
          {format(new Date(), 'MMMM yyyy')}
        </div>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0">
        {days.map(({ date, events }) => (
          <div key={date.toISOString()}>
            <div
              className="text-xs font-bold uppercase tracking-wider px-1 mb-1"
              style={{ color: isToday(date) ? 'var(--color-accent)' : 'var(--color-subtext)' }}
            >
              {dayLabel(date)}
            </div>

            {events.length === 0 ? (
              <div className="text-xs px-2 py-1 opacity-30" style={{ color: 'var(--color-subtext)' }}>
                No events
              </div>
            ) : (
              events.map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 px-2 py-1.5 rounded mb-0.5"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <div
                    className="w-1 rounded-full shrink-0 self-stretch mt-0.5"
                    style={{ background: event.calColor, minHeight: '0.75rem' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                      {event.title}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-subtext)' }}>
                      {event.allDay
                        ? 'All day'
                        : `${format(parseISO(event.start), 'h:mm a')} – ${format(parseISO(event.end), 'h:mm a')}`}
                      {event.location && ` · ${event.location}`}
                    </div>
                  </div>
                  {event.calLabel && (
                    <div className="text-xs shrink-0 opacity-50" style={{ color: 'var(--color-subtext)' }}>
                      {event.calLabel}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
