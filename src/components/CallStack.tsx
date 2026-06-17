import { FileCode, ChevronRight } from 'lucide-react';
import { useReplayStore } from '../store/replayStore';

export default function CallStack() {
  const { callStack: frames } = useReplayStore();

  return (
    <div style={{ overflow: 'auto' }}>
      {/* ── Panel header ─────────────────────────── */}
      <div style={{
        padding: '7px 10px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: 'var(--text)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Call Stack
        </span>
        <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          {frames.length} frames
        </span>
      </div>

      {/* ── Frame list ───────────────────────────── */}
      <div style={{ padding: '4px 0' }}>
        {frames.length === 0 ? (
          <div style={{
            padding: '14px 12px',
            fontSize: 11, color: 'var(--text3)', textAlign: 'center',
          }}>
            No call stack captured
          </div>
        ) : (
          frames.map((frame, i) => {
            const isTop = i === 0;
            return (
              <div
                key={frame.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  background: isTop ? 'var(--bg3)' : 'transparent',
                  borderLeft: isTop ? '2px solid var(--blue)' : '2px solid transparent',
                  transition: 'background 80ms',
                }}
                onMouseEnter={e => { if (!isTop) e.currentTarget.style.background = 'var(--bg3)'; }}
                onMouseLeave={e => { if (!isTop) e.currentTarget.style.background = 'transparent'; }}
              >
                <FileCode
                  size={11}
                  style={{ color: isTop ? 'var(--blue)' : 'var(--text3)', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: isTop ? 'var(--text)' : 'var(--text2)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {frame.functionName || '<anonymous>'}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--text3)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {frame.fileName}:{frame.lineNumber}
                  </div>
                </div>
                <ChevronRight size={9} style={{ color: 'var(--text3)', flexShrink: 0 }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
