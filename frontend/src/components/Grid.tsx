import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useDashboard } from '../store';
import { isTileVisible } from '../hooks/useSchedule';
import ClockTile from './tiles/ClockTile';
import WeatherTile from './tiles/WeatherTile';
import NewsTile from './tiles/NewsTile';
import CountdownTile from './tiles/CountdownTile';
import CalendarTile from './tiles/CalendarTile';
import type { Tile } from '../types';

interface Props {
  adminUnlocked: boolean;
  onEditTile: (tile: Tile) => void;
  width: number;
  height: number;
}

const COLS = 12;
const GRID_ROWS = 6;
const MARGIN = 12;
const PADDING = 16;

function TileContent({ tile }: { tile: Tile }) {
  switch (tile.type) {
    case 'clock':     return <ClockTile />;
    case 'weather':   return <WeatherTile />;
    case 'news':      return <NewsTile />;
    case 'countdown': return <CountdownTile config={tile.config as { label?: string; targetDate?: string }} />;
    case 'calendar':  return <CalendarTile />;
    default:          return <div className="p-4 opacity-40">Unknown tile type</div>;
  }
}

export default function Grid({ adminUnlocked, onEditTile, width, height }: Props) {
  const { tiles, saveLayouts } = useDashboard();
  // Fill the screen exactly: solve for rowHeight given fixed rows, margins, padding
  const rowHeight = Math.floor((height - PADDING * 2 - MARGIN * (GRID_ROWS - 1)) / GRID_ROWS);

  const visible = tiles.filter(t => t.enabled && isTileVisible(t.schedule));

  const layout = visible.map(t => ({
    i: t.id,
    x: t.layout.x,
    y: t.layout.y,
    w: t.layout.w,
    h: t.layout.h,
    minW: 1,
    minH: 1
  }));

  function onLayoutChange(newLayout: ReactGridLayout.Layout[]) {
    const updates = newLayout.map(l => ({
      id: l.i,
      layout: { x: l.x, y: l.y, w: l.w, h: l.h }
    }));
    saveLayouts(updates);
  }

  return (
    <ReactGridLayout
      className="layout"
      layout={layout}
      cols={COLS}
      rowHeight={rowHeight}
      width={width}
      isDraggable={adminUnlocked}
      isResizable={adminUnlocked}
      onLayoutChange={onLayoutChange}
      margin={[MARGIN, MARGIN]}
      containerPadding={[PADDING, PADDING]}
      draggableHandle=".tile-drag-handle"
    >
      {visible.map(tile => (
        <div key={tile.id} className="tile-wrapper rounded-2xl overflow-hidden flex flex-col"
          style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {adminUnlocked && (
            <div className="tile-drag-handle flex items-center justify-between px-3 py-1.5 shrink-0 cursor-grab active:cursor-grabbing"
              style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-subtext)' }}>{tile.title}</span>
              <button
                onClick={() => onEditTile(tile)}
                className="text-xs px-2 py-0.5 rounded opacity-60 hover:opacity-100"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
              >
                Edit
              </button>
            </div>
          )}
          <div className="flex-1 min-h-0 p-3">
            <TileContent tile={tile} />
          </div>
        </div>
      ))}
    </ReactGridLayout>
  );
}
