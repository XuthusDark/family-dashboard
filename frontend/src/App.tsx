import { useEffect, useRef, useState } from 'react';
import { useDashboard } from './store';
import { useNightMode } from './hooks/useNightMode';
import Grid from './components/Grid';
import PinEntry from './components/admin/PinEntry';
import AdminPanel from './components/admin/AdminPanel';
import type { Tile } from './types';

export default function App() {
  const { loadTiles, loadTheme, loadNightMode, theme, isNightDimmed, nightMode, adminUnlocked, setAdminUnlocked } = useDashboard();
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [editingTile, setEditingTile] = useState<Tile | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(window.innerWidth);
  const [gridHeight, setGridHeight] = useState(window.innerHeight);

  useNightMode();

  useEffect(() => {
    loadTiles();
    loadTheme();
    loadNightMode();
  }, []);

  useEffect(() => {
    function onResize() {
      setGridWidth(containerRef.current?.clientWidth ?? window.innerWidth);
      setGridHeight(window.innerHeight);
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Apply CSS variables from theme
  useEffect(() => {
    if (!theme) return;
    const colors = theme[theme.mode];
    const root = document.documentElement;
    root.style.setProperty('--color-bg', colors.bg);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-subtext', colors.subtext);
    if (theme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Long-press anywhere (600ms) opens admin
  const pressTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  function onPointerDown() {
    pressTimer.current = setTimeout(() => {
      if (!adminUnlocked) setShowPinEntry(true);
      else setShowAdmin(true);
    }, 600);
  }
  function onPointerUp() { clearTimeout(pressTimer.current); }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden select-none"
      style={{ background: 'var(--color-bg)', width: '100vw', height: '100vh' }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Night dim overlay */}
      {isNightDimmed && (
        <div
          className="fixed inset-0 z-30 pointer-events-none transition-opacity duration-1000"
          style={{ background: '#000', opacity: 1 - (nightMode?.dimLevel ?? 0.05) }}
        />
      )}

      {/* Admin toolbar (shown when unlocked) */}
      {adminUnlocked && !showAdmin && !showPinEntry && (
        <div className="fixed top-3 right-3 z-20 flex gap-2">
          <button
            onClick={() => setShowAdmin(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg"
            style={{ background: 'var(--color-accent)' }}
          >
            ⚙️ Admin
          </button>
          <button
            onClick={() => setAdminUnlocked(false)}
            className="px-4 py-2 rounded-xl text-sm font-semibold shadow-lg"
            style={{ background: 'var(--color-surface)', color: 'var(--color-subtext)' }}
          >
            Lock
          </button>
        </div>
      )}

      <Grid
        adminUnlocked={adminUnlocked}
        onEditTile={tile => { setEditingTile(tile); setShowAdmin(true); }}
        width={gridWidth}
        height={gridHeight}
      />

      {showPinEntry && (
        <PinEntry
          onSuccess={() => { setShowPinEntry(false); setAdminUnlocked(true); setShowAdmin(true); }}
          onCancel={() => setShowPinEntry(false)}
        />
      )}

      {showAdmin && (
        <AdminPanel
          onClose={() => { setShowAdmin(false); setEditingTile(null); }}
        />
      )}
    </div>
  );
}
