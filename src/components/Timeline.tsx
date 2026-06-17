import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, AlertCircle } from 'lucide-react';
import { useReplayStore } from '../store/replayStore';

// ─── Constants ────────────────────────────────────────────────────────────────
const LANE_HEIGHT = 22;   // px per lane
const LABEL_W    = 56;    // px for right-aligned lane label
const LANE_GAP   = 4;     // gap between lanes

// Lane definitions
const LANES = [
  { key: 'http',    label: 'http',    color: '#60A5FA' },
  { key: 'db',      label: 'db',      color: '#C084FC' },
  { key: 'redis',   label: 'redis',   color: '#4ADE80' },
  { key: 'fn',      label: 'fn calls',color: '#52525B' },
  { key: 'errors',  label: 'errors',  color: '#F87171' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLane(type: string): string {
  if (type.startsWith('http')) return 'http';
  if (type.startsWith('db'))   return 'db';
  if (type === 'redis_command') return 'redis';
  if (type === 'error' || type === 'v8_crash_snapshot') return 'errors';
  if (type === 'function_call') return 'fn';
  return 'fn';
}

function fmt(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Timeline() {
  const trackRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const {
    currentReplay, cursorPosition, isPlaying,
    setCursorPosition, stepForward, stepBackward, togglePlaying,
    jumpToError, jumpToStart, jumpToEnd,
  } = useReplayStore();

  const [zoom, setZoom] = useState<'30s' | '5s' | '1s'>('30s');

  const events = currentReplay?.events || [];

  const baseTime = useMemo(() =>
    events.length > 0 ? events[0].timestamp : 0,
  [events]);

  const totalDuration = useMemo(() =>
    events.length < 2 ? 1000 : events[events.length - 1].timestamp - events[0].timestamp,
  [events]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => stepForward(), 200);
    return () => clearInterval(id);
  }, [isPlaying, stepForward]);

  // Seek by pixel position in a track container
  const seekByPct = useCallback((pct: number) => {
    const targetTime = baseTime + pct * totalDuration;
    let closest = 0, minDist = Infinity;
    events.forEach((evt, i) => {
      const d = Math.abs(evt.timestamp - targetTime);
      if (d < minDist) { minDist = d; closest = i; }
    });
    setCursorPosition(closest);
  }, [events, baseTime, totalDuration, setCursorPosition]);

  const seekFromMouseEvent = useCallback((clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const trackW = rect.width - LABEL_W;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left - LABEL_W) / trackW));
    seekByPct(pct);
  }, [seekByPct]);

  // Mouse drag on main lanes
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    seekFromMouseEvent(e.clientX, e.currentTarget);
  }, [seekFromMouseEvent]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !trackRef.current) return;
      requestAnimationFrame(() => seekFromMouseEvent(e.clientX, trackRef.current!));
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [seekFromMouseEvent]);

  // Minimap seek
  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const trackW = rect.width - LABEL_W;
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left - LABEL_W) / trackW));
    seekByPct(pct);
  }, [seekByPct]);

  // Cursor pct
  const cursorPct = useMemo(() => {
    if (!events[cursorPosition]) return 0;
    return ((events[cursorPosition].timestamp - baseTime) / totalDuration) * 100;
  }, [events, cursorPosition, baseTime, totalDuration]);

  const errorIndex = events.findIndex(e => e.type === 'error' || e.type === 'v8_crash_snapshot');
  const currentTime = events[cursorPosition]?.timestamp;

  // Build lane event lists
  const laneEvents = useMemo(() => {
    const map: Record<string, typeof events> = { http: [], db: [], redis: [], fn: [], errors: [] };
    events.forEach(evt => {
      const lane = getLane(evt.type);
      if (map[lane]) map[lane].push(evt);
    });
    return map;
  }, [events]);

  // Time ruler ticks (6 evenly spaced)
  const ticks = useMemo(() => {
    const count = 6;
    return Array.from({ length: count }, (_, i) => {
      const pct = (i / (count - 1)) * 100;
      const ms = (pct / 100) * totalDuration;
      return { pct, label: fmt(ms) };
    });
  }, [totalDuration]);

  // HTTP durations (from httpCaptures if available)
  const httpCaptures = currentReplay?.httpCaptures || [];

  if (events.length === 0) {
    return (
      <div style={{
        height: 48, background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: 'var(--text3)', flexShrink: 0,
      }}>
        No events to display
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg2)',
      borderTop: '1px solid var(--border)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
    }}>

      {/* ── Controls row ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 12px', borderBottom: '1px solid var(--border)',
        gap: 8,
      }}>
        {/* Left: title + id */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>Execution timeline</span>
          {currentReplay && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
              {currentReplay.id?.slice(0, 12)}… · {currentReplay.errorMessage?.slice(0, 30) || 'no error'}
            </span>
          )}
        </div>

        {/* Center: playback controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn-ghost btn-icon" style={{ padding: 3 }} onClick={jumpToStart} title="Jump to start"><SkipBack size={13} /></button>
          <button className="btn btn-ghost btn-icon" style={{ padding: 3 }} onClick={() => stepBackward()} title="Step back"><SkipBack size={11} /></button>
          <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={togglePlaying} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button className="btn btn-ghost btn-icon" style={{ padding: 3 }} onClick={() => stepForward()} title="Step forward"><SkipForward size={11} /></button>
          <button className="btn btn-ghost btn-icon" style={{ padding: 3 }} onClick={jumpToEnd} title="Jump to end"><SkipForward size={13} /></button>

          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', marginLeft: 4 }}>
            {currentTime ? `+${(currentTime - baseTime).toFixed(0)}ms` : '0ms'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>
            ({cursorPosition + 1}/{events.length})
          </span>
        </div>

        {/* Right: zoom + jump to error */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Zoom window selector */}
          <div className="tab-list" style={{ padding: 1 }}>
            {(['30s', '5s', '1s'] as const).map(z => (
              <button key={z} className={`tab${zoom === z ? ' active' : ''}`}
                style={{ padding: '2px 7px', fontSize: 10 }}
                onClick={() => setZoom(z)}>{z}</button>
            ))}
          </div>

          {errorIndex >= 0 && (
            <button
              className="btn btn-xs"
              onClick={jumpToError}
              style={{ color: 'var(--red)', borderColor: '#7F0000', background: 'var(--red-dim)', gap: 4, fontSize: 11 }}
            >
              <AlertCircle size={11} />
              Jump to Error
            </button>
          )}
        </div>
      </div>

      {/* ── Time ruler ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', paddingRight: 0,
        height: 18, position: 'relative',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
      }}>
        {/* spacer for label column */}
        <div style={{ width: LABEL_W, flexShrink: 0 }} />
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          {ticks.map((t, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${t.pct}%`,
              top: 0, bottom: 0,
              display: 'flex', alignItems: 'center',
              transform: i === 0 ? 'none' : i === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
            }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5 Lane tracks ─────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        style={{ position: 'relative', cursor: 'crosshair', padding: `${LANE_GAP}px 0` }}
      >
        {LANES.map((lane) => {
          const laneEvts = laneEvents[lane.key] || [];
          return (
            <div key={lane.key} style={{
              display: 'flex', alignItems: 'center',
              height: LANE_HEIGHT, marginBottom: LANE_GAP,
            }}>
              {/* Lane label — right-aligned, fixed width */}
              <div style={{
                width: LABEL_W, textAlign: 'right', paddingRight: 8,
                fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)',
                flexShrink: 0, lineHeight: `${LANE_HEIGHT}px`,
              }}>
                {lane.label}
              </div>

              {/* Lane track */}
              <div style={{
                flex: 1, height: LANE_HEIGHT,
                background: 'var(--bg3)', borderRadius: 3,
                position: 'relative', overflow: 'hidden',
              }}>
                {/* HTTP spans (use httpCaptures for real durations) */}
                {lane.key === 'http' && httpCaptures.map((cap, i) => {
                  const evt = events.find(e => e.type === 'http_request' && (e.data?.url === cap.url || i < 5));
                  if (!evt) return null;
                  const startPct = ((evt.timestamp - baseTime) / totalDuration) * 100;
                  const capDuration = cap.duration ?? 0;
                  const durationPct = (capDuration / totalDuration) * 100;
                  return (
                    <div key={i} title={`${cap.method} ${cap.url} — ${capDuration}ms`} style={{
                      position: 'absolute',
                      left: `${startPct}%`, width: `${Math.max(durationPct, 0.5)}%`,
                      top: 3, bottom: 3,
                      background: '#60A5FA26',
                      border: '1px solid #60A5FA66',
                      borderRadius: '2px',
                    }} />
                  );
                })}

                {/* Event dots / markers */}
                {laneEvts.map((evt, i) => {
                  const pct = ((evt.timestamp - baseTime) / totalDuration) * 100;
                  const isError = lane.key === 'errors';
                  const isSlowDb = lane.key === 'db' && (evt.data as any)?.durationMs > 100;

                  if (isError) {
                    // Red square marker
                    return (
                      <div key={i}
                        className="event-error-dot"
                        onClick={e => { e.stopPropagation(); setCursorPosition(events.indexOf(evt)); }}
                        title={(evt.data as any)?.message || 'Error'}
                        style={{
                          position: 'absolute',
                          left: `${pct}%`, top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 8, height: 8,
                          background: '#F87171',
                          borderRadius: 2,
                          cursor: 'pointer', zIndex: 5,
                        }} />
                    );
                  }

                  return (
                    <div key={i}
                      onClick={e => { e.stopPropagation(); setCursorPosition(events.indexOf(evt)); }}
                      title={`${evt.type} +${(evt.timestamp - baseTime).toFixed(0)}ms`}
                      style={{
                        position: 'absolute',
                        left: `${pct}%`, top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 6, height: 6,
                        borderRadius: '50%',
                        background: isSlowDb ? '#FBBF24' : lane.color,
                        cursor: 'pointer',
                        zIndex: 2,
                        transition: 'transform 80ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.6)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translate(-50%, -50%)'; }}
                    />
                  );
                })}

                {/* Cursor line on each lane */}
                <div style={{
                  position: 'absolute',
                  left: `${cursorPct}%`, top: 0, bottom: 0,
                  width: 1,
                  background: 'rgba(255,255,255,0.5)',
                  pointerEvents: 'none',
                  zIndex: 10,
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Minimap overview row ──────────────────────────────────────── */}
      <div
        ref={minimapRef}
        onClick={handleMinimapClick}
        style={{
          display: 'flex', alignItems: 'center',
          borderTop: '1px solid var(--border)',
          cursor: 'pointer', height: 18,
          background: 'var(--bg)',
        }}
      >
        {/* label */}
        <div style={{
          width: LABEL_W, textAlign: 'right', paddingRight: 8,
          fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)',
          flexShrink: 0,
        }}>
          overview
        </div>

        {/* minimap track */}
        <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
          {/* All events as 2px colored bars */}
          {events.map((evt, i) => {
            const pct = ((evt.timestamp - baseTime) / totalDuration) * 100;
            const lane = getLane(evt.type);
            const color = LANES.find(l => l.key === lane)?.color || '#52525B';
            return (
              <div key={i} style={{
                position: 'absolute',
                left: `${pct}%`, top: 0, bottom: 0,
                width: 2, background: color, opacity: 0.7,
              }} />
            );
          })}

          {/* Viewport indicator */}
          <div style={{
            position: 'absolute',
            left: `${Math.max(0, cursorPct - 15)}%`,
            width: '30%', top: 0, bottom: 0,
            background: 'rgba(96,165,250,0.12)',
            border: '1px solid rgba(96,165,250,0.35)',
            borderRadius: 2,
          }} />
        </div>
      </div>

      {/* ── Legend row ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '5px 12px 5px', paddingLeft: LABEL_W + 12,
        borderTop: '1px solid var(--border)',
        flexWrap: 'wrap',
      }}>
        {/* span types */}
        {[
          { label: 'HTTP span',   color: '#60A5FA', type: 'span' },
          { label: 'HTTP event',  color: '#60A5FA', type: 'dot' },
          { label: 'DB span',     color: '#C084FC', type: 'span' },
          { label: 'Slow query',  color: '#FBBF24', type: 'dot' },
          { label: 'Cache hit',   color: '#4ADE80', type: 'dot' },
          { label: 'Fn call',     color: '#52525B', type: 'dot' },
          { label: 'Error',       color: '#F87171', type: 'square' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)' }}>
            {item.type === 'span' ? (
              <div style={{ width: 14, height: 6, background: item.color + '33', border: `1px solid ${item.color}66`, borderRadius: 1 }} />
            ) : item.type === 'square' ? (
              <div style={{ width: 7, height: 7, background: item.color, borderRadius: 1 }} />
            ) : (
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color }} />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
