import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertCircle, Globe, Zap, Clock, ChevronRight, Activity, Trash2 } from 'lucide-react';
import { mockReplays } from '../data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { useReplayStore } from '../store/replayStore';
import type { Replay } from '../store/replayStore';
import Onboarding from './Onboarding';

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
          background: 'var(--pr-depth-2)',
          border: '0.5px solid var(--pr-border-soft)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 150ms var(--ease-smooth)',
          transformStyle: 'preserve-3d',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--pr-depth-3)';
          e.currentTarget.style.borderColor = 'var(--pr-border-medium)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--pr-depth-2)';
          e.currentTarget.style.borderColor = 'var(--pr-border-soft)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span className={`badge ${config.badgeClass}`}>
                {config.label}
              </span>
              <span className="badge badge-neutral">
                {replay.serviceName}
              </span>
              <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-code)' }}>
                {replay.environment}
              </span>
            </div>

            {replay.errorMessage && (
              <div style={{
                fontFamily: 'var(--font-code)', fontSize: 13, color: 'var(--pr-text-primary)',
                marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight: 1.4,
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
              display: 'flex', alignItems: 'center', gap: 16,
              fontSize: 12, color: 'var(--pr-text-tertiary)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} />
                {formatDistanceToNow(new Date(replay.capturedAt), { addSuffix: true })}
              </span>
              <span style={{ fontFamily: 'var(--font-code)' }}>
                {replay.durationMs}ms
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={12} />
                {replay.eventCount} events
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight size={16} color="var(--pr-text-tertiary)" style={{ flexShrink: 0, marginTop: 8 }} />
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
  const { replays, fetchReplays, isLoading } = useReplayStore();

  useEffect(() => {
    fetchReplays();
  }, [fetchReplays]);

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

  const filtered = useMemo(() => {
    return allReplays.filter(r => {
      const matchSearch = !search ||
        r.errorMessage?.toLowerCase().includes(search.toLowerCase()) ||
        r.serviceName.toLowerCase().includes(search.toLowerCase()) ||
        r.triggerLabel?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filterType === 'all' || r.triggerType === filterType;
      const matchEnv = filterEnv === 'all' || r.environment === filterEnv;
      const matchService = filterService === 'all' || r.serviceName === filterService;
      return matchSearch && matchFilter && matchEnv && matchService;
    });
  }, [allReplays, search, filterType, filterEnv, filterService]);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'uncaught_exception', label: 'Exceptions' },
    { value: 'http_error', label: 'HTTP Errors' },
    { value: 'performance', label: 'Performance' },
    { value: 'manual', label: 'Manual' },
  ];

  if (!isLoading && allReplays.length === 0 && !search && filterType === 'all' && filterEnv === 'all' && filterService === 'all') {
    return <Onboarding />;
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
