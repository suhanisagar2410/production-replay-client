import { Globe, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { HttpCapture } from '../store/replayStore';

function StatusBadge({ code }: { code?: number }) {
  if (!code) return null;
  const cls = code >= 500 ? 'badge-error' : code >= 400 ? 'badge-warning' : 'badge-success';
  return <span className={`badge ${cls}`}>{code}</span>;
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'var(--pr-event-function)',
    POST: 'var(--pr-event-manual)',
    PUT: 'var(--pr-warning)',
    DELETE: 'var(--pr-danger)',
    PATCH: 'var(--pr-event-http)',
  };
  return (
    <span style={{
      fontFamily: 'var(--font-code)', fontSize: 11, fontWeight: 600,
      color: colors[method] || 'var(--pr-text-secondary)',
      minWidth: 36,
    }}>
      {method}
    </span>
  );
}

function HttpRow({ capture }: { capture: HttpCapture }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ borderBottom: '0.5px solid var(--pr-border-subtle)' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          cursor: 'pointer', transition: 'background 80ms',
        }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--pr-depth-3)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        {expanded ? <ChevronDown size={12} color="var(--pr-text-tertiary)" /> : <ChevronRight size={12} color="var(--pr-text-tertiary)" />}
        <MethodBadge method={capture.method} />
        <span style={{
          flex: 1, fontFamily: 'var(--font-code)', fontSize: 12,
          color: 'var(--pr-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {capture.url}
        </span>
        <StatusBadge code={capture.statusCode} />
        {capture.duration && (
          <span style={{ fontFamily: 'var(--font-code)', fontSize: 11, color: capture.duration > 200 ? 'var(--pr-warning)' : 'var(--pr-text-tertiary)' }}>
            {capture.duration}ms
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ padding: '8px 12px 12px 32px', fontSize: 12 }}>
          {/* REQUEST HEADERS */}
          {capture.requestHeaders && Object.keys(capture.requestHeaders).length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pr-text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Request Headers</div>
              <pre style={{
                fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--pr-text-secondary)',
                background: 'var(--pr-depth-1)', padding: 8, borderRadius: 'var(--radius-sm)',
                overflow: 'auto', maxHeight: 120,
              }}>
                {JSON.stringify(capture.requestHeaders, null, 2)}
              </pre>
            </div>
          )}
          
          {/* REQUEST BODY */}
          {capture.requestBody !== undefined && capture.requestBody !== null && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pr-text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Request Body</div>
              <pre style={{
                fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--pr-text-secondary)',
                background: 'var(--pr-depth-1)', padding: 8, borderRadius: 'var(--radius-sm)',
                overflow: 'auto', maxHeight: 120,
              }}>
                {JSON.stringify(capture.requestBody, null, 2)}
              </pre>
            </div>
          )}

          {/* RESPONSE HEADERS */}
          {capture.responseHeaders && Object.keys(capture.responseHeaders).length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pr-text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Response Headers</div>
              <pre style={{
                fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--pr-text-secondary)',
                background: 'var(--pr-depth-1)', padding: 8, borderRadius: 'var(--radius-sm)',
                overflow: 'auto', maxHeight: 120,
              }}>
                {JSON.stringify(capture.responseHeaders, null, 2)}
              </pre>
            </div>
          )}

          {/* RESPONSE BODY */}
          {capture.responseBody !== undefined && capture.responseBody !== null && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pr-text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Response Body</div>
              <pre style={{
                fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--pr-text-secondary)',
                background: 'var(--pr-depth-1)', padding: 8, borderRadius: 'var(--radius-sm)',
                overflow: 'auto', maxHeight: 120,
              }}>
                {JSON.stringify(capture.responseBody, null, 2)}
              </pre>
            </div>
          )}

          {/* EMPTY STATE */}
          {!capture.requestBody && !capture.responseBody && (!capture.requestHeaders || Object.keys(capture.requestHeaders).length === 0) && (!capture.responseHeaders || Object.keys(capture.responseHeaders).length === 0) && (
            <div style={{ color: 'var(--pr-text-tertiary)', fontStyle: 'italic' }}>
              No additional payload or headers captured.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NetworkPanel({ captures }: { captures: HttpCapture[] }) {
  return (
    <div style={{ overflow: 'auto', flex: 1 }}>
      {captures.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--pr-text-tertiary)', fontSize: 13 }}>
          <Globe size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          No HTTP requests captured
        </div>
      ) : (
        captures.map(c => <HttpRow key={c.id} capture={c} />)
      )}
    </div>
  );
}
