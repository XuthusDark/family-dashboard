import ical from 'node-ical';

function startOfDay(d) {
  const r = new Date(d); r.setHours(0,0,0,0); return r;
}
function endOfDay(d) {
  const r = new Date(d); r.setHours(23,59,59,999); return r;
}
function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isAllDay(event) {
  return event.start && event.start.dateOnly;
}

function expandRecurring(event, rangeStart, rangeEnd) {
  // node-ical doesn't expand recurring events automatically for async fetch,
  // so we handle simple RRULE cases (weekly/daily/monthly). Complex exclusions
  // are skipped — good enough for a family calendar.
  if (!event.rrule) return null;

  const occurrences = [];
  try {
    const rule = event.rrule;
    const dates = rule.between(rangeStart, rangeEnd, true);
    for (const date of dates) {
      const duration = event.end - event.start;
      occurrences.push({
        ...event,
        start: date,
        end: new Date(date.getTime() + duration),
        rrule: null
      });
    }
  } catch {
    // If rrule expansion fails, skip
  }
  return occurrences;
}

export async function fetchCalendar(urls, daysAhead = 14) {
  if (cache && Date.now() - cacheTime < CACHE_TTL) return cache;
  if (!urls || urls.length === 0) return { events: [], updatedAt: new Date().toISOString() };

  const rangeStart = startOfDay(new Date());
  const rangeEnd = endOfDay(addDays(rangeStart, daysAhead));

  const allEvents = [];

  await Promise.allSettled(urls.map(async ({ url, label, color }) => {
    let data;
    try {
      data = await ical.async.fromURL(url);
    } catch {
      return;
    }

    for (const event of Object.values(data)) {
      if (event.type !== 'VEVENT') continue;

      const eventsToProcess = event.rrule
        ? (expandRecurring(event, rangeStart, rangeEnd) ?? [])
        : [event];

      for (const ev of eventsToProcess) {
        const start = ev.start instanceof Date ? ev.start : new Date(ev.start);
        const end   = ev.end   instanceof Date ? ev.end   : new Date(ev.end ?? ev.start);

        const allDay = isAllDay(ev);
        const inRange = allDay
          ? start <= rangeEnd && (ev.end ? end >= rangeStart : true)
          : (start >= rangeStart && start <= rangeEnd) || (end >= rangeStart && end <= rangeEnd);

        if (!inRange) continue;

        allEvents.push({
          id: `${ev.uid ?? ''}-${start.toISOString()}`,
          title: ev.summary ?? '(No title)',
          start: start.toISOString(),
          end:   end.toISOString(),
          allDay,
          location: ev.location ?? null,
          calLabel: label ?? null,
          calColor: color ?? '#38bdf8'
        });
      }
    }
  }));

  allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

  cache = { events: allEvents, updatedAt: new Date().toISOString() };
  cacheTime = Date.now();
  return cache;
}

export function clearCalendarCache() {
  cache = null;
  cacheTime = 0;
}
