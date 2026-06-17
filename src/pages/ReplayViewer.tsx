import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Server, Share2, ArrowLeft, Globe, Database, Activity, Check } from 'lucide-react';
import { useReplayStore } from '../store/replayStore';
import Timeline from '../components/Timeline';
import VariableTree from '../components/VariableTree';
import CallStack from '../components/CallStack';
import NetworkPanel from '../components/NetworkPanel';
import QueryPanel from '../components/QueryPanel';

export default function ReplayViewer() {
  const { id, shareToken } = useParams<{ id?: string; shareToken?: string }>();
  const navigate = useNavigate();
  const { currentReplay, setCurrentReplay, cursorPosition, fetchReplayById, fetchPublicReplayById, traceReplays, fetchTraceReplays } = useReplayStore();
  const [rightTab, setRightTab] = useState<'http' | 'db' | 'events'>('http');
  const [sharing, setSharing] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = async () => {
    if (!currentReplay?.id) return;
    setSharing(true);
    try {
      const { shareReplay } = await import('../api');
      const { shareToken } = await shareReplay(currentReplay.id);
      const url = `${window.location.origin}/shared/${shareToken}`;
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch (err) {
      console.error('Failed to share replay', err);
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReplayById(id);
    } else if (shareToken) {
      fetchPublicReplayById(shareToken);
    }
    return () => setCurrentReplay(null);
  }, [id, shareToken, setCurrentReplay, fetchReplayById, fetchPublicReplayById]);

  useEffect(() => {
    if (currentReplay?.id && !shareToken) {
      fetchTraceReplays(currentReplay.id);
    }
  }, [currentReplay?.id, shareToken, fetchTraceReplays]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const store = useReplayStore.getState();
      switch (e.key) {
        case 'r':
        case 'R':
          store.jumpToError();
          break;
        case ' ':
          e.preventDefault();
          store.togglePlaying();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          store.stepBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          store.stepForward();
          break;
        case 'k':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            navigate('/replays'); // Go to list where search is
          }
          break;
        case 'Escape':
          navigate('/replays');
          break;
        case '1':
          setRightTab('http');
          break;
        case '2':
          setRightTab('db');
          break;
        case '3':
          setRightTab('events');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  if (!currentReplay || !currentReplay.events || !currentReplay.httpCaptures || !currentReplay.dbQueries) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text3)',
      }}>
        <div className="skeleton" style={{ width: 200, height: 16, borderRadius: 6 }} />
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
    v8_crash_snapshot: { label: 'V8 Crash', color: 'var(--pr-event-error)' },
    manual_capture: { label: 'Manual', color: 'var(--pr-event-manual)' },
    redis_command: { label: 'Redis', color: 'var(--pr-event-redis)' },
  };

  return (
    <div className="panel-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* TOP BAR */}
      <div style={{
        height: 38,
        minHeight: 38,
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 10,
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
        flexShrink: 0,
      }}>
        {!shareToken && (
          <button className="btn btn-ghost btn-icon" style={{ padding: 3 }} onClick={() => navigate('/replays')} aria-label="Back">
            <ArrowLeft size={13} />
          </button>
        )}

        <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{currentReplay.id?.slice(0,14)}…</span>

        <span style={{ color: 'var(--border2)' }}>·</span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text2)', fontSize: 11 }}>
          <Clock size={11} />
          {new Date(currentReplay.capturedAt).toLocaleString()}
        </span>

        <span style={{ color: 'var(--border2)' }}>·</span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text2)', fontSize: 11 }}>
          <Server size={11} />
          {currentReplay.serviceName}
        </span>

        {/* Severity badge */}
        {currentReplay.severity && (() => {
          const sev = currentReplay.severity as string;
          const sevColor: Record<string, string> = {
            critical: '#F87171', error: '#F87171',
            warning: '#FBBF24', info: '#60A5FA',
          };
          return (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: sevColor[sev] || 'var(--text3)',
              background: (sevColor[sev] || '#52525B') + '22',
              border: `1px solid ${(sevColor[sev] || '#52525B')}55`,
              borderRadius: 4, padding: '1px 6px',
            }}>{sev}</span>
          );
        })()}

        <span className="badge badge-crash" style={{ fontSize: 10 }}>
          {currentReplay.triggerType.replace(/_/g, ' ').toUpperCase()}
        </span>

        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: 11 }}>
          {currentReplay.durationMs}ms
        </span>

        {currentReplay.sdkVersion && (
          <>
            <span style={{ color: 'var(--border2)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: 11 }}>
              SDK v{currentReplay.sdkVersion}
            </span>
          </>
        )}

        {traceReplays.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--text3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trace:</span>
            {traceReplays.map(tr => (
              <button
                key={tr.id}
                onClick={() => navigate(`/replays/${tr.id}`)}
                className="badge"
                style={{
                  cursor: 'pointer',
                  background: tr.id === currentReplay.id ? 'var(--blue-dim)' : 'var(--bg3)',
                  color: tr.id === currentReplay.id ? 'var(--blue)' : 'var(--text2)',
                  border: `1px solid ${tr.id === currentReplay.id ? 'var(--blue-dim)' : 'var(--border)'}`,
                }}
              >
                <Server size={9} />
                {tr.serviceName}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {currentReplay.events.some(e => e.type === 'error' || e.type === 'v8_crash_snapshot') && (
          <button
            className="btn btn-xs"
            onClick={() => useReplayStore.getState().jumpToError()}
            style={{ color: 'var(--red)', borderColor: '#7F0000', background: 'var(--red-dim)', gap: 4 }}
          >
            <AlertCircle size={11} /> Jump to Error
          </button>
        )}

        {!shareToken && (
          <button 
            className="btn btn-ghost btn-xs" 
            style={{ gap: 4, color: copiedShare ? 'var(--green)' : 'inherit' }}
            onClick={handleShare}
            disabled={sharing}
          >
            {copiedShare ? <Check size={11} /> : <Share2 size={11} />}
            {copiedShare ? 'Copied!' : sharing ? 'Sharing...' : 'Share'}
          </button>
        )}
      </div>

      {/* ERROR BANNER — shown when replay has an error */}
      {currentReplay.errorMessage && (
        <div style={{
          background: 'var(--red-dim)',
          borderBottom: '1px solid #7F0000',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <AlertCircle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {currentReplay.errorMessage}
            </span>
          </div>
          {currentReplay.errorStack && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)',
              opacity: 0.7, flexShrink: 0,
            }}>
              {currentReplay.errorStack.split('\n')[1]?.trim() || ''}
            </span>
          )}
        </div>
      )}

      {/* 3-PANEL BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT PANEL */}
        <div style={{
          width: '26%',
          minWidth: 220,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg2)',
        }}>
          <div style={{ flex: '0 0 auto', maxHeight: '45%', overflow: 'auto', borderBottom: '1px solid var(--border)' }}>
            <CallStack />
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <VariableTree />
          </div>
        </div>

        {/* CENTER PANEL */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg)',
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
                {(currentEvent.type === 'error' || currentEvent.type === 'v8_crash_snapshot') && (
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
                      {(currentEvent.data as any).name || (currentEvent.data as any).reason || 'Error'}: {(currentEvent.data as any).message || 'Process crashed'}
                    </div>
                    <pre style={{
                      fontFamily: 'var(--font-code)', fontSize: 11, color: 'var(--pr-text-secondary)',
                      whiteSpace: 'pre-wrap', lineHeight: 1.6,
                    }}>
                      {(currentEvent.data as any).stack || JSON.stringify((currentEvent.data as any).callStack, null, 2)}
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

        {/* RIGHT PANEL */}
        <div style={{
          width: '26%',
          minWidth: 220,
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg2)',
        }}>
          {/* Tabs */}
          <div className="tab-list" style={{ margin: '6px 8px', flexShrink: 0 }}>
            <button id="tab-http" className={`tab${rightTab === 'http' ? ' active' : ''}`} onClick={() => setRightTab('http')}>
              <Globe size={11} style={{ marginRight: 3 }} />
              HTTP <span className="tab-count">{currentReplay.httpCaptures.length}</span>
            </button>
            <button id="tab-db" className={`tab${rightTab === 'db' ? ' active' : ''}`} onClick={() => setRightTab('db')}>
              <Database size={11} style={{ marginRight: 3 }} />
              DB <span className="tab-count">{currentReplay.dbQueries.length}</span>
            </button>
            <button id="tab-events" className={`tab${rightTab === 'events' ? ' active' : ''}`} onClick={() => setRightTab('events')}>
              <Activity size={11} style={{ marginRight: 3 }} />
              Events <span className="tab-count">{currentReplay.events.length}</span>
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
                        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
                        cursor: 'pointer',
                        background: isCurrent ? 'var(--bg3)' : 'transparent',
                        borderLeft: isCurrent ? `2px solid ${info?.color || 'var(--text3)'}` : '2px solid transparent',
                        transition: 'background 80ms',
                      }}
                      onClick={() => useReplayStore.getState().setCursorPosition(i)}
                      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--bg3)'; }}
                      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: info?.color || 'var(--text3)',
                      }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', flex: 1 }}>
                        {info?.label || evt.type}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>
                        +{(evt.timestamp - (currentReplay.events![0]?.timestamp || 0)).toFixed(0)}ms
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
