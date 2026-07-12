import { create } from 'zustand';
import type { Tile, Theme, NightMode } from '../types';

const API = '/api';

interface DashboardStore {
  tiles: Tile[];
  theme: Theme | null;
  nightMode: NightMode | null;
  isNightDimmed: boolean;
  adminUnlocked: boolean;

  loadTiles: () => Promise<void>;
  loadTheme: () => Promise<void>;
  loadNightMode: () => Promise<void>;
  saveTile: (tile: Tile) => Promise<void>;
  deleteTile: (id: string) => Promise<void>;
  saveLayouts: (layouts: { id: string; layout: Tile['layout'] }[]) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setNightMode: (nm: NightMode) => Promise<void>;
  setAdminUnlocked: (v: boolean) => void;
  setIsNightDimmed: (v: boolean) => void;
  verifyPin: (pin: string) => Promise<boolean>;
}

export const useDashboard = create<DashboardStore>((set, get) => ({
  tiles: [],
  theme: null,
  nightMode: null,
  isNightDimmed: false,
  adminUnlocked: false,

  loadTiles: async () => {
    const res = await fetch(`${API}/tiles`);
    set({ tiles: await res.json() });
  },

  loadTheme: async () => {
    const res = await fetch(`${API}/settings/theme`);
    if (res.ok) set({ theme: await res.json() });
  },

  loadNightMode: async () => {
    const res = await fetch(`${API}/settings/night_mode`);
    if (res.ok) set({ nightMode: await res.json() });
  },

  saveTile: async (tile) => {
    const res = await fetch(`${API}/tiles/${tile.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tile)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? 'Save failed');
    }
    await get().loadTiles();
  },

  deleteTile: async (id) => {
    await fetch(`${API}/tiles/${id}`, { method: 'DELETE' });
    set(s => ({ tiles: s.tiles.filter(t => t.id !== id) }));
  },

  saveLayouts: async (layouts) => {
    await fetch(`${API}/tiles/layouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(layouts)
    });
  },

  setTheme: async (theme) => {
    await fetch(`${API}/settings/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theme)
    });
    set({ theme });
  },

  setNightMode: async (nm) => {
    await fetch(`${API}/settings/night_mode`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nm)
    });
    set({ nightMode: nm });
  },

  setAdminUnlocked: (v) => set({ adminUnlocked: v }),
  setIsNightDimmed: (v) => set({ isNightDimmed: v }),

  verifyPin: async (pin) => {
    const res = await fetch(`${API}/settings/admin/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    return data.ok === true;
  }
}));
