import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { useReplayStore } from '../store/replayStore';


const EVENT_COLORS: Record<string, string> = {
  function_call: 'var(--pr-event-function)',
  http_request: 'var(--pr-event-http)',
  http_response: 'var(--pr-event-http)',
  db_query_start: 'var(--pr-event-database)',
  db_query_end: 'var(--pr-event-database)',
  error: 'var(--pr-event-error)',
  manual_capture: 'var(--pr-event-manual)',
  redis_command: 'var(--pr-event-redis)',
};

export default function Timeline() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { currentReplay, cursorPosition, isPlaying, zoomLevel,
    setCursorPosition, stepForward, stepBackward, togglePlaying,
    jumpToError, jumpToStart, jumpToEnd, setZoomLevel } = useReplayStore();

  const events = currentReplay?.events || [];
  const totalDuration = useMemo(() => {
    if (events.length < 2) return 1000;
    return events[events.length - 1].timestamp - events[0].timestamp;
  }, [events]);

  const baseTime = events.length > 0 ? events[0].timestamp : 0;

  /* Auto-play */
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      stepForward();
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying, stepForward]);

  const isDragging = useRef(false);

  const seekToPosition = useCallback((clientX: number) => {
    if (!trackRef.current || events.length === 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = baseTime + pct * totalDuration;

    let closest = 0;
    let minDist = Infinity;
    events.forEach((evt, i) => {
      const d = Math.abs(evt.timestamp - targetTime);
      if (d < minDist) { minDist = d; closest = i; }
    });
    setCursorPosition(closest);
  }, [events, baseTime, totalDuration, setCursorPosition]);

  /* Dragging event handlers */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    seekToPosition(e.clientX);
  }, [seekToPosition]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        requestAnimationFrame(() => {
          seekToPosition(e.clientX);
        });
      }
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [seekToPosition]);

  const cursorPct = useMemo(() => {
    if (events.length === 0) return 0;
    const curEvent = events[cursorPosition];
    if (!curEvent) return 0;
    return ((curEvent.timestamp - baseTime) / totalDuration) * 100;
  }, [events, cursorPosition, baseTime, totalDuration]);

  const currentTime = events[cursorPosition]?.timestamp;
  const errorIndex = events.findIndex(e => e.type === 'error' || e.type === 'v8_crash_snapshot');

  return (
    <div style={{
      height: 120,
      background: 'var(--pr-depth-1)',
      borderTop: '0.5px solid var(--pr-border-soft)',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 16px',
      gap: 4,
      flexShrink: 0,
    }}>
      {/* Minimap */}
      <div style={{
        height: 20,
        background: 'var(--pr-depth-2)',
        borderRadius: 'var(--radius-sm)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {events.map((evt, i) => {
          const pct = ((evt.timestamp - baseTime) / totalDuration) * 100;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: '50%',
                transform: 'translateY(-50%)',
                width: (evt.type === 'error' || evt.type === 'v8_crash_snapshot') ? 4 : 2,
                height: (evt.type === 'error' || evt.type === 'v8_crash_snapshot') ? 14 : 8,
                background: EVENT_COLORS[evt.type] || 'var(--pr-event-error)',
                borderRadius: 1,
                opacity: 0.7,
              }}
            />
          );
        })}
        {/* Visible range indicator */}
        <div style={{
          position: 'absolute',
          left: `${Math.max(0, cursorPct - 15)}%`,
          width: '30%',
          top: 0, bottom: 0,
          background: 'rgba(99, 102, 241, 0.1)',
          border: '0.5px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-sm)',
        }} />
      </div>

      {/* Main Track */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        style={{
          flex: 1,
          background: 'var(--pr-depth-2)',
          borderRadius: 'var(--radius-sm)',
          position: 'relative',
          cursor: 'crosshair',
          overflow: 'hidden',
          minHeight: 56,
        }}
      >
        {/* Event dots */}
        {events.map((evt, i) => {
          const pct = ((evt.timestamp - baseTime) / totalDuration) * 100;
          const isError = evt.type === 'error' || evt.type === 'v8_crash_snapshot';
          return (
            <div
              key={i}
              className={isError ? 'event-error-dot' : ''}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: '50%',
                transform: 'translateY(-50%)',
                width: isError ? 6 : evt.type.startsWith('http') || evt.type.startsWith('db') ? 4 : 3,
                height: isError ? 6 : evt.type.startsWith('http') || evt.type.startsWith('db') ? 16 : 12,
                background: EVENT_COLORS[evt.type] || 'var(--pr-event-error)',
                borderRadius: isError ? '50%' : 2,
                boxShadow: isError ? '0 0 12px 2px rgba(239, 68, 68, 0.8)' : 'none',
                cursor: 'pointer',
                transition: 'transform 80ms',
                zIndex: isError ? 5 : 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(-50%)'; }}
              onClick={e => { e.stopPropagation(); setCursorPosition(i); }}
            />
          );
        })}

        {/* Cursor line */}
        <div style={{
          position: 'absolute',
          left: `${cursorPct}%`,
          top: 0,
          bottom: 0,
          width: 1.5,
          background: 'white',
          boxShadow: '0 0 8px rgba(255,255,255,0.6)',
          zIndex: 10,
          pointerEvents: 'none',
          transition: 'left 80ms var(--ease-spring)',
        }} />
      </div>

      {/* Controls bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 24,
        fontSize: 11,
        color: 'var(--pr-text-tertiary)',
        fontFamily: 'var(--font-code)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-ghost btn-icon" style={{ padding: 2 }} onClick={jumpToStart} aria-label="Jump to start">
            <SkipBack size={14} />
          </button>
          <button className="btn btn-ghost btn-icon" style={{ padding: 2 }} onClick={() => stepBackward()} aria-label="Step back">
            <SkipBack size={12} />
          </button>
          <button className="btn btn-ghost btn-icon" style={{ padding: 3 }} onClick={togglePlaying} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button className="btn btn-ghost btn-icon" style={{ padding: 2 }} onClick={() => stepForward()} aria-label="Step forward">
            <SkipForward size={12} />
          </button>
          <button className="btn btn-ghost btn-icon" style={{ padding: 2 }} onClick={jumpToEnd} aria-label="Jump to end">
            <SkipForward size={14} />
          </button>

          {errorIndex >= 0 && (
            <button className="btn btn-ghost btn-xs" onClick={jumpToError}
              style={{ color: 'var(--pr-event-error)', gap: 4 }}>
              <AlertCircle size={12} /> Jump to Error
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{cursorPosition + 1} / {events.length} events</span>
          {currentTime && (
            <span style={{ color: 'var(--pr-text-secondary)' }}>
              +{((currentTime - baseTime)).toFixed(0)}ms
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn-ghost btn-icon" style={{ padding: 2 }} onClick={() => setZoomLevel(zoomLevel - 1)} aria-label="Zoom out">
            <ZoomOut size={14} />
          </button>
          <span>{zoomLevel}x</span>
          <button className="btn btn-ghost btn-icon" style={{ padding: 2 }} onClick={() => setZoomLevel(zoomLevel + 1)} aria-label="Zoom in">
            <ZoomIn size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
