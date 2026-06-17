import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertCircle, Globe, Zap, Clock, ChevronRight, Activity, Trash2, Copy, Check, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useReplayStore } from '../store/replayStore';
import type { Replay } from '../store/replayStore';

const triggerConfig: Record<string, { color: string; icon: typeof AlertCircle; label: string; badgeClass: string }> = {
  uncaught_exception: { color: 'var(--pr-event-error)', icon: AlertCircle, label: 'Exception', badgeClass: 'badge-error' },
  unhandled_rejection: { color: 'var(--pr-event-error)', icon: AlertCircle, label: 'Rejection', badgeClass: 'badge-error' },
  http_error: { color: 'var(--pr-event-http)', icon: Globe, label: 'HTTP Error', badgeClass: 'badge-info' },
  manual: { color: 'var(--pr-event-manual)', icon: Zap, label: 'Manual', badgeClass: 'badge-success' },
  performance: { color: 'var(--pr-event-perf)', icon: Activity, label: 'Performance', badgeClass: 'badge-warning' },
};

function ReplayCard({ replay, index }: { replay: Replay; index: number }) {
  const navigate = useNavigate();
  const config = triggerConfig[replay.triggerType] || triggerConfig.manual;
  const Icon = config.icon;

  return (
    <div
      className="stagger-item"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={() => navigate(`/replays/${replay.id}`)}
      onKeyDown={e => e.key === 'Enter' && navigate(`/replays/${replay.id}`)}
      role="button"
      tabIndex={0}
    >
      <div
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '12px 14px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 120ms, background 120ms',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--bg3)';
          e.currentTarget.style.borderColor = 'var(--border2)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--bg2)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        {/* Left accent bar */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: config.color,
          borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingLeft: 8 }}>
          {/* Icon */}
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: `${config.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: 2,
          }}>
            <Icon size={16} color={config.color} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              {/* Severity badge */}
              {(replay as any).severity && (() => {
                const sev = (replay as any).severity as string;
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
              <span className={`badge ${config.badgeClass}`}>{config.label}</span>
              <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                {replay.serviceName}
              </span>
              <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {replay.environment}
              </span>
              {/* SDK version */}
              {(replay as any).sdkVersion && (
                <span style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)',
                  marginLeft: 'auto',
                }}>v{(replay as any).sdkVersion}</span>
              )}
            </div>

            {replay.errorMessage && (
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)',
                marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {replay.errorMessage}
              </div>
            )}

            {replay.triggerLabel && !replay.errorMessage && (
              <div style={{
                fontFamily: 'var(--font-code)', fontSize: 13, color: 'var(--pr-text-secondary)',
                marginBottom: 6,
              }}>
                {replay.triggerLabel}
              </div>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              fontSize: 11, color: 'var(--text3)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                {formatDistanceToNow(new Date(replay.capturedAt), { addSuffix: true })}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {replay.durationMs}ms
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={11} />
                {replay.eventCount} events
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight size={14} color="var(--text3)" style={{ flexShrink: 0, marginTop: 4 }} />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ maxWidth: 640, width: '100%' }}>
        {/* Live Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, padding: '16px 24px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-lg)' }}>
          <Loader2 size={20} className="spinner" style={{ color: '#3b82f6' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#3b82f6' }}>Waiting for first replay...</div>
            <div style={{ fontSize: 13, color: 'var(--pr-text-secondary)' }}>This page will automatically update when a crash is intercepted.</div>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--pr-text-primary)' }}>
          Install the SDK
        </h1>
        <p style={{ color: 'var(--pr-text-secondary)', marginBottom: 32 }}>
          You don't have any replays yet. Install the Production Replay SDK to start capturing errors instantly.
        </p>

        {/* Step 1 */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--pr-text-primary)' }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--pr-depth-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>1</div>
            Install via npm
          </h3>
          <div style={{ position: 'relative' }}>
            <pre style={{ background: 'var(--pr-depth-0)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--pr-border-soft)', color: '#10b981', fontFamily: 'var(--font-code)', fontSize: 14 }}>
              npm install @production-replay/sdk
            </pre>
            <button 
              onClick={() => copyCode('npm install @production-replay/sdk', 'npm')}
              className="btn btn-secondary" 
              style={{ position: 'absolute', right: 8, top: 8, padding: '4px 8px' }}
            >
              {copied === 'npm' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--pr-text-primary)' }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--pr-depth-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>2</div>
            Initialize at the top of your app
          </h3>
          <div style={{ position: 'relative' }}>
            <pre style={{ background: 'var(--pr-depth-0)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--pr-border-soft)', fontFamily: 'var(--font-code)', fontSize: 13, lineHeight: 1.5, overflowX: 'auto', color: 'var(--pr-text-primary)' }}>
{`import { replay } from '@production-replay/sdk';

replay.init({
  apiKey: 'YOUR_API_KEY', // Check Settings for your key
  serviceName: 'my-express-api',
  environment: 'development'
});`}
            </pre>
            <button 
              onClick={() => copyCode(`import { replay } from '@production-replay/sdk';\n\nreplay.init({\n  apiKey: 'YOUR_API_KEY',\n  serviceName: 'my-express-api',\n  environment: 'development'\n});`, 'init')}
              className="btn btn-secondary" 
              style={{ position: 'absolute', right: 8, top: 8, padding: '4px 8px' }}
            >
              {copied === 'init' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ReplayList() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEnv, setFilterEnv] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterSdkVersion, setFilterSdkVersion] = useState<string>('all');
  const { replays, fetchReplays, isLoading } = useReplayStore();

  useEffect(() => {
    fetchReplays();
  }, [fetchReplays]);

  // Live polling when there are no replays
  useEffect(() => {
    if (replays.length === 0) {
      const interval = setInterval(() => {
        fetchReplays();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [replays.length, fetchReplays]);

  // Always show data from API only
  const allReplays = useMemo(() => {
    return replays;
  }, [replays]);

  const environments = useMemo(() => {
    const envs = new Set(allReplays.map(r => r.environment).filter(Boolean));
    return ['all', ...Array.from(envs)];
  }, [allReplays]);

  const services = useMemo(() => {
    const srvs = new Set(allReplays.map(r => r.serviceName).filter(Boolean));
    return ['all', ...Array.from(srvs)];
  }, [allReplays]);

  const sdkVersions = useMemo(() => {
    const sdks = new Set(allReplays.map(r => (r as any).sdkVersion).filter(Boolean));
    return ['all', ...Array.from(sdks)];
  }, [allReplays]);

  const filtered = useMemo(() => {
    return allReplays.filter(r => {
      const matchSearch = !search ||
        r.errorMessage?.toLowerCase().includes(search.toLowerCase()) ||
        r.serviceName.toLowerCase().includes(search.toLowerCase()) ||
        r.triggerLabel?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filterType === 'all' || r.triggerType === filterType;
      const matchEnv = filterEnv === 'all' || r.environment === filterEnv;
      const matchService = filterService === 'all' || r.serviceName === filterService;
      const matchSdkVersion = filterSdkVersion === 'all' || (r as any).sdkVersion === filterSdkVersion;
      return matchSearch && matchFilter && matchEnv && matchService && matchSdkVersion;
    });
  }, [allReplays, search, filterType, filterEnv, filterService, filterSdkVersion]);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'uncaught_exception', label: 'Exceptions' },
    { value: 'http_error', label: 'HTTP Errors' },
    { value: 'performance', label: 'Performance' },
    { value: 'manual', label: 'Manual' },
  ];

  if (!isLoading && allReplays.length === 0 && !search && filterType === 'all' && filterEnv === 'all' && filterService === 'all' && filterSdkVersion === 'all') {
    return <EmptyState />;
  }

  return (
    <div className="panel-enter" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 32px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--type-display-xl)', fontWeight: 700,
            color: 'var(--pr-text-primary)', marginBottom: 6,
          }}>
            Replays
          </h1>
          <p style={{ fontSize: 'var(--type-body-sm)', color: 'var(--pr-text-secondary)' }}>
            {allReplays.length} captured replays across all services
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all replays? This action cannot be undone.')) {
              useReplayStore.getState().clearAllReplays();
            }
          }}
          disabled={allReplays.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--pr-event-error)', color: 'var(--pr-event-error)' }}
        >
          <Trash2 size={14} />
          Clear All
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--pr-text-tertiary)' }} />
          <input
            className="input"
            placeholder="Search replays..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32, width: '100%' }}
          />
        </div>

        <select 
          className="input" 
          style={{ width: 'auto', paddingRight: 32 }}
          value={filterEnv}
          onChange={e => setFilterEnv(e.target.value)}
        >
          {environments.map(env => (
            <option key={env} value={env}>{env === 'all' ? 'All Environments' : env}</option>
          ))}
        </select>

        <select 
          className="input" 
          style={{ width: 'auto', paddingRight: 32 }}
          value={filterService}
          onChange={e => setFilterService(e.target.value)}
        >
          {services.map(srv => (
            <option key={srv} value={srv}>{srv === 'all' ? 'All Services' : srv}</option>
          ))}
        </select>

        <select 
          className="input" 
          style={{ width: 'auto', paddingRight: 32 }}
          value={filterSdkVersion}
          onChange={e => setFilterSdkVersion(e.target.value)}
        >
          {sdkVersions.map(ver => (
            <option key={ver} value={ver}>{ver === 'all' ? 'All SDK Versions' : `SDK v${ver}`}</option>
          ))}
        </select>

        <div className="tab-list" style={{ padding: 3 }}>
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              className={`tab ${filterType === opt.value ? 'active' : ''}`}
              onClick={() => setFilterType(opt.value)}
            >
              <Filter size={12} style={{ marginRight: 4, display: 'inline' }} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Replay List */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
        {filtered.length > 0 ? (
          filtered.map((replay, i) => (
            <ReplayCard key={replay.id} replay={replay} index={i} />
          ))
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'var(--pr-text-tertiary)', gap: 16, padding: 48,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--radius-lg)',
              background: 'var(--pr-depth-2)', border: '0.5px solid var(--pr-border-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Search size={28} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--pr-text-secondary)', marginBottom: 6 }}>
                No replays found
              </div>
              <div style={{ fontSize: 13 }}>Try adjusting your search or filters</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
