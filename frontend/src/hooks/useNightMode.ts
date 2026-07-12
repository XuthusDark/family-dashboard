import { useEffect } from 'react';
import { useDashboard } from '../store';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function useNightMode() {
  const { nightMode, setIsNightDimmed } = useDashboard();

  useEffect(() => {
    if (!nightMode?.enabled) {
      setIsNightDimmed(false);
      return;
    }

    function check() {
      if (!nightMode) return;
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const start = timeToMinutes(nightMode.start);
      const end = timeToMinutes(nightMode.end);

      let dimmed: boolean;
      if (start > end) {
        // spans midnight e.g. 22:00 -> 07:00
        dimmed = minutes >= start || minutes < end;
      } else {
        dimmed = minutes >= start && minutes < end;
      }
      setIsNightDimmed(dimmed);
    }

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [nightMode, setIsNightDimmed]);
}
