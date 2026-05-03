import { Database } from 'lucide-react';
import type { DbQuery } from '../store/replayStore';

const DB_COLORS: Record<string, string> = {
  postgresql: 'var(--pr-event-database)',
  mongodb: 'var(--pr-event-manual)',
  redis: 'var(--pr-event-redis)',
};

export default function QueryPanel({ queries }: { queries: DbQuery[] }) {
  return (
    <div style={{ overflow: 'auto', flex: 1 }}>
      {queries.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--pr-text-tertiary)', fontSize: 13 }}>
          <Database size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          No database queries captured
        </div>
      ) : (
        queries.map(q => (
          <div
            key={q.id}
            style={{
              padding: '10px 12px',
              borderBottom: '0.5px solid var(--pr-border-subtle)',
              transition: 'background 80ms',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--pr-depth-3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-code)', color: DB_COLORS[q.dbType] || 'var(--pr-text-secondary)' }}>
                {q.dbType}
              </span>
              {q.duration !== undefined && (
                <span style={{
                  fontFamily: 'var(--font-code)', fontSize: 11,
                  color: q.duration > 100 ? 'var(--pr-warning)' : 'var(--pr-text-tertiary)',
                }}>
                  {q.duration}ms
                </span>
              )}
              {q.rowCount !== undefined && (
                <span style={{ fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--pr-text-tertiary)' }}>
                  {q.rowCount} rows
                </span>
              )}
            </div>
            <pre style={{
              fontFamily: 'var(--font-code)',
              fontSize: 12,
              color: 'var(--pr-event-database)',
              background: 'var(--pr-depth-1)',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5,
            }}>
              {q.sql}
            </pre>
            {q.params && q.params.length > 0 && (
              <div style={{
                marginTop: 4,
                fontFamily: 'var(--font-code)',
                fontSize: 11,
                color: 'var(--pr-text-tertiary)',
              }}>
                params: [{q.params.map(p => JSON.stringify(p)).join(', ')}]
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
