import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Server, Share2, ArrowLeft, Globe, Database, Activity } from 'lucide-react';
import { useReplayStore } from '../store/replayStore';
import { mockReplays } from '../data/mockData';
import Timeline from '../components/Timeline';
import VariableTree from '../components/VariableTree';
import CallStack from '../components/CallStack';
import NetworkPanel from '../components/NetworkPanel';
import QueryPanel from '../components/QueryPanel';

export default function ReplayViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentReplay, setCurrentReplay, cursorPosition, fetchReplayById } = useReplayStore();
  const [rightTab, setRightTab] = useState<'http' | 'db' | 'events'>('http');

  useEffect(() => {
    if (id) {
      fetchReplayById(id);
    }
    return () => setCurrentReplay(null);
  }, [id, setCurrentReplay, fetchReplayById]);

  if (!currentReplay) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--pr-text-tertiary)',
      }}>
        <div className="skeleton" style={{ width: 200, height: 20, borderRadius: 'var(--radius-md)' }} />
      </div>
    );
  }

  const currentEvent = currentReplay.events[cursorPosition];

  const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    function_call: { label: 'Function Call', color: 'var(--pr-event-function)' },
    http_request: { label: 'HTTP Request', color: 'var(--pr-event-http)' },
    http_response: { label: 'HTTP Response', color: 'var(--pr-event-http)' },
    db_query_start: { label: 'DB Query', color: 'var(--pr-event-database)' },
    db_query_end: { label: 'DB Result', color: 'var(--pr-event-database)' },
    error: { label: 'Error', color: 'var(--pr-event-error)' },
    manual_capture: { label: 'Manual', color: 'var(--pr-event-manual)' },
    redis_command: { label: 'Redis', color: 'var(--pr-event-redis)' },
  };

  return (
    <div className="panel-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* TOP BAR — 36px fixed */}
      <div style={{
        height: 36,
        minHeight: 36,
        background: 'var(--pr-depth-1)',
        borderBottom: '0.5px solid var(--pr-border-soft)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 16,
        fontSize: 12,
        fontFamily: 'var(--font-code)',
      }}>
        <button className="btn btn-ghost btn-icon" style={{ padding: 2 }} onClick={() => navigate('/replays')} aria-label="Back">
          <ArrowLeft size={14} />
        </button>

        <span style={{ color: 'var(--pr-text-tertiary)' }}>{currentReplay.id}</span>
        <span style={{ color: 'var(--pr-border-medium)' }}>·</span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--pr-text-secondary)' }}>
          <Clock size={12} />
          {new Date(currentReplay.capturedAt).toLocaleString()}
        </span>
        <span style={{ color: 'var(--pr-border-medium)' }}>·</span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--pr-text-secondary)' }}>
          <Server size={12} />
          {currentReplay.serviceName}
        </span>
        <span style={{ color: 'var(--pr-border-medium)' }}>·</span>

        <span className="badge badge-error" style={{ fontSize: 11 }}>
          <AlertCircle size={10} />
          {currentReplay.triggerType.replace(/_/g, ' ')}
        </span>

        <span style={{ fontFamily: 'var(--font-code)', color: 'var(--pr-text-tertiary)' }}>
          {currentReplay.durationMs}ms
        </span>

        <div style={{ flex: 1 }} />

        <button className="btn btn-ghost btn-xs" style={{ gap: 4 }}>
          <Share2 size={12} /> Share
        </button>
      </div>

      {/* 3-PANEL BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT PANEL — 30% */}
        <div style={{
          width: '28%',
          minWidth: 240,
          borderRight: '0.5px solid var(--pr-border-soft)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--pr-depth-1)',
        }}>
          <div style={{ flex: '0 0 auto', maxHeight: '45%', overflow: 'auto', borderBottom: '0.5px solid var(--pr-border-subtle)' }}>
            <CallStack />
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <VariableTree />
          </div>
        </div>

        {/* CENTER PANEL — 42% */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--pr-depth-0)',
        }}>
          {/* Current event detail */}
          {currentEvent ? (
            <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: EVENT_TYPE_LABELS[currentEvent.type]?.color || 'var(--pr-text-tertiary)',
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
                    color: 'var(--pr-text-primary)',
                  }}>
                    {EVENT_TYPE_LABELS[currentEvent.type]?.label || currentEvent.type}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--pr-text-tertiary)',
                  }}>
                    +{(currentEvent.timestamp - (currentReplay.events[0]?.timestamp || 0)).toFixed(0)}ms
                  </span>
                </div>

                {/* Error display */}
                {currentEvent.type === 'error' && (
                  <div style={{
                    background: 'var(--pr-danger-bg)',
                    border: '0.5px solid rgba(239,68,68,0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 16,
                    marginBottom: 12,
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-code)', fontSize: 14, fontWeight: 600,
                      color: 'var(--pr-danger)', marginBottom: 8,
                    }}>
                      {(currentEvent.data as any).name}: {(currentEvent.data as any).message}
                    </div>
                    <pre style={{
                      fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--pr-text-secondary)',
                      whiteSpace: 'pre-wrap', lineHeight: 1.6,
                    }}>
                      {(currentEvent.data as any).stack}
                    </pre>
                  </div>
                )}

                {/* Function call display */}
                {currentEvent.type === 'function_call' && (
                  <div style={{
                    background: 'var(--pr-depth-2)',
                    border: '0.5px solid var(--pr-border-soft)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 16,
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-code)', fontSize: 15,
                      color: 'var(--pr-event-function)', marginBottom: 4,
                    }}>
                      {(currentEvent.data as any).name}()
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-code)', fontSize: 12,
                      color: 'var(--pr-text-tertiary)', marginBottom: 12,
                    }}>
                      {(currentEvent.data as any).file}:{(currentEvent.data as any).line}
                    </div>
                    {(currentEvent.data as any).args && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pr-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                          Arguments
                        </div>
                        <pre style={{
                          fontFamily: 'var(--font-code)', fontSize: 12, color: 'var(--pr-text-secondary)',
                          background: 'var(--pr-depth-1)', padding: 10, borderRadius: 'var(--radius-sm)',
                          overflow: 'auto', lineHeight: 1.6,
                        }}>
                          {JSON.stringify((currentEvent.data as any).args, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Generic event data display */}
                {!['error', 'function_call'].includes(currentEvent.type) && (
                  <div style={{
                    background: 'var(--pr-depth-2)',
                    border: '0.5px solid var(--pr-border-soft)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 16,
                  }}>
                    <pre style={{
                      fontFamily: 'var(--font-code)', fontSize: 12, color: 'var(--pr-text-secondary)',
                      whiteSpace: 'pre-wrap', lineHeight: 1.6,
                    }}>
                      {JSON.stringify(currentEvent.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--pr-text-tertiary)', fontSize: 14,
            }}>
              Select an event on the timeline
            </div>
          )}
        </div>

        {/* RIGHT PANEL — 30% */}
        <div style={{
          width: '28%',
          minWidth: 240,
          borderLeft: '0.5px solid var(--pr-border-soft)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--pr-depth-1)',
        }}>
          {/* Tabs */}
          <div className="tab-list" style={{ margin: 8, flexShrink: 0 }}>
            <button className={`tab ${rightTab === 'http' ? 'active' : ''}`} onClick={() => setRightTab('http')}>
              <Globe size={12} style={{ marginRight: 4 }} />
              HTTP
              <span className="tab-count">{currentReplay.httpCaptures.length}</span>
            </button>
            <button className={`tab ${rightTab === 'db' ? 'active' : ''}`} onClick={() => setRightTab('db')}>
              <Database size={12} style={{ marginRight: 4 }} />
              DB
              <span className="tab-count">{currentReplay.dbQueries.length}</span>
            </button>
            <button className={`tab ${rightTab === 'events' ? 'active' : ''}`} onClick={() => setRightTab('events')}>
              <Activity size={12} style={{ marginRight: 4 }} />
              Events
              <span className="tab-count">{currentReplay.events.length}</span>
            </button>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {rightTab === 'http' && <NetworkPanel captures={currentReplay.httpCaptures} />}
            {rightTab === 'db' && <QueryPanel queries={currentReplay.dbQueries} />}
            {rightTab === 'events' && (
              <div>
                {currentReplay.events.map((evt, i) => {
                  const info = EVENT_TYPE_LABELS[evt.type];
                  const isCurrent = i === cursorPosition;
                  return (
                    <div
                      key={evt.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                        cursor: 'pointer',
                        background: isCurrent ? 'var(--pr-depth-3)' : 'transparent',
                        borderLeft: isCurrent ? `2px solid ${info?.color || 'var(--pr-text-tertiary)'}` : '2px solid transparent',
                        transition: 'background 80ms',
                      }}
                      onClick={() => useReplayStore.getState().setCursorPosition(i)}
                      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--pr-depth-2)'; }}
                      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: info?.color || 'var(--pr-text-tertiary)',
                      }} />
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--pr-text-secondary)', flex: 1 }}>
                        {info?.label || evt.type}
                      </span>
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: 10, color: 'var(--pr-text-tertiary)' }}>
                        +{(evt.timestamp - (currentReplay.events[0]?.timestamp || 0)).toFixed(0)}ms
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TIMELINE BAR — 120px fixed bottom */}
      <Timeline />
    </div>
  );
}
