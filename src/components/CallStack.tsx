import { FileCode, ChevronRight } from 'lucide-react';
import { useReplayStore } from '../store/replayStore';
import { mockCallStack } from '../data/mockData';

export default function CallStack() {
  const { callStack: liveFrames } = useReplayStore();
  const frames = liveFrames.length > 0 ? liveFrames : mockCallStack;

  return (
    <div style={{ overflow: 'auto' }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '0.5px solid var(--pr-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--pr-text-primary)' }}>
          Call Stack
        </span>
        <span style={{ fontSize: 11, color: 'var(--pr-text-tertiary)', fontFamily: 'var(--font-code)' }}>
          {frames.length} frames
        </span>
      </div>

      <div style={{ padding: '4px 0' }}>
        {frames.map((frame, i) => (
          <div
            key={frame.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              marginLeft: 4,
              marginRight: 4,
              transition: 'background 80ms',
              background: i === 0 ? 'var(--pr-depth-3)' : 'transparent',
              borderLeft: i === 0 ? '2px solid var(--pr-accent-primary)' : '2px solid transparent',
            }}
            onMouseEnter={e => { if (i !== 0) e.currentTarget.style.background = 'var(--pr-depth-3)'; }}
            onMouseLeave={e => { if (i !== 0) e.currentTarget.style.background = 'transparent'; }}
          >
            <FileCode size={12} style={{ color: 'var(--pr-text-tertiary)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-code)',
                fontSize: 12,
                color: i === 0 ? 'var(--pr-text-primary)' : 'var(--pr-text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {frame.functionName}
              </div>
              <div style={{
                fontFamily: 'var(--font-code)',
                fontSize: 11,
                color: 'var(--pr-text-tertiary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {frame.fileName}:{frame.lineNumber}
              </div>
            </div>
            <ChevronRight size={10} style={{ color: 'var(--pr-text-tertiary)', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
