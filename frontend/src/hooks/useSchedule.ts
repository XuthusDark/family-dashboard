import { useMemo } from 'react';
import type { TileSchedule } from '../types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function isTileVisible(schedule: TileSchedule): boolean {
  if (schedule.always) return true;

  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const minutes = now.getHours() * 60 + now.getMinutes();

  if (schedule.days && schedule.days.length > 0) {
    if (!schedule.days.includes(dayName)) return false;
  }

  if (schedule.timeStart && schedule.timeEnd) {
    const start = timeToMinutes(schedule.timeStart);
    const end = timeToMinutes(schedule.timeEnd);
    if (start <= end) {
      if (minutes < start || minutes > end) return false;
    } else {
      // spans midnight
      if (minutes < start && minutes > end) return false;
    }
  }

  return true;
}

export function useSchedule(schedule: TileSchedule): boolean {
  return useMemo(() => isTileVisible(schedule), [schedule]);
}
