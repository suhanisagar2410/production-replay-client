import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale,
  ArcElement, BarController, BarElement, Tooltip, Filler,
} from 'chart.js';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Activity, RefreshCw } from 'lucide-react';
import { fetchStats, type DashboardStats } from '../api';

// ─── Register Chart.js components ────────────────────────────────────────────
Chart.register(
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
  ArcElement, BarController, BarElement, Tooltip, Filler,
);

// ─── Chart defaults — zinc dark ────────────────────────────────────────────
Chart.defaults.color = '#52525B';
Chart.defaults.borderColor = '#27272A';
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.font.size = 11;

// ─── Types ────────────────────────────────────────────────────────────────────
type Range = '24h' | '7d' | '30d';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function trendIcon(current: number, prev: number, lowerIsBetter = false) {
  if (prev === 0 || current === prev) return <Minus size={11} />;
  const up = current > prev;
  const good = lowerIsBetter ? !up : up;
  return up
    ? <TrendingUp  size={11} style={{ color: good ? 'var(--green)' : 'var(--red)' }} />
    : <TrendingDown size={11} style={{ color: good ? 'var(--green)' : 'var(--red)' }} />;
}

function trendLabel(current: number, prev: number) {
  if (prev === 0) return 'No prior data';
  const pct = Math.abs(((current - prev) / prev) * 100).toFixed(1);
  return `${current >= prev ? '+' : '-'}${pct}% vs prev period`;
}

// ─── Chart Panel wrapper ──────────────────────────────────────────────────────
function ChartPanel({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '16px 18px', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Chart 1 — Replays Over Time (line) ──────────────────────────────────────
function ReplayLineChart({ data }: { data: DashboardStats['replaysByDay'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chart.current?.destroy();
    chart.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [
          {
            label: 'Total',
            data: data.map(d => d.total),
            borderColor: '#60A5FA',
            borderWidth: 1.5,
            pointRadius: 3,
            pointBackgroundColor: '#60A5FA',
            tension: 0.3,
            fill: false,
          },
          {
            label: 'Errors',
            data: data.map(d => d.errors),
            borderColor: '#F87171',
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 3,
            pointBackgroundColor: '#F87171',
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: '#18181B',
            borderColor: '#27272A',
            borderWidth: 1,
            titleColor: '#FAFAFA',
            bodyColor: '#A1A1AA',
            padding: 10,
          },
          legend: { display: false },
        },
        scales: {
          x: { grid: { color: '#1C1C1F' }, ticks: { color: '#52525B' } },
          y: { grid: { color: '#1C1C1F' }, ticks: { color: '#52525B' }, beginAtZero: true },
        },
      },
    });
    return () => chart.current?.destroy();
  }, [data]);

  // Custom legend
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        {[{ color: '#60A5FA', label: 'Total captures', dash: false },
          { color: '#F87171', label: 'Errors', dash: true }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
            <div style={{
              width: 20, height: 2,
              background: l.dash ? 'transparent' : l.color,
              borderTop: l.dash ? `2px dashed ${l.color}` : 'none',
            }} />
            {l.label}
          </div>
        ))}
      </div>
      <div style={{ height: 180 }}>
        <canvas ref={ref} />
      </div>
    </div>
  );
}

// ─── Chart 2 — By Trigger Type (doughnut) ────────────────────────────────────
function TriggerDoughnut({ data }: { data: DashboardStats['triggerBreakdown'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);

  const colorMap: Record<string, string> = {
    uncaught_exception: '#F87171',
    unhandled_rejection: '#F87171',
    http_error: '#FBBF24',
    manual: '#60A5FA',
    performance: '#C084FC',
  };

  const labelMap: Record<string, string> = {
    uncaught_exception: 'CRASH',
    unhandled_rejection: 'REJECTION',
    http_error: 'HTTP 5xx',
    manual: 'MANUAL',
    performance: 'SLOW',
  };

  const total = data.reduce((s, d) => s + d.count, 0);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    chart.current?.destroy();
    chart.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: data.map(d => labelMap[d.type] || d.type.toUpperCase()),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: data.map(d => (colorMap[d.type] || '#52525B') + '99'),
          borderColor: data.map(d => colorMap[d.type] || '#52525B'),
          borderWidth: 1,
          hoverOffset: 6,
        }],
      },
      options: {
        cutout: '65%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: '#18181B', borderColor: '#27272A', borderWidth: 1,
            titleColor: '#FAFAFA', bodyColor: '#A1A1AA', padding: 10,
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0}%)`,
            },
          },
          legend: { display: false },
        },
      },
    });
    return () => chart.current?.destroy();
  }, [data]);

  if (data.length === 0) return <EmptyChart label="No replays yet" />;

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
        <canvas ref={ref} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>total</span>
        </div>
      </div>
      {/* Custom legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {data.map(d => (
          <div key={d.type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: colorMap[d.type] || '#52525B', flexShrink: 0 }} />
            <span style={{ color: 'var(--text2)', flex: 1 }}>{labelMap[d.type] || d.type}</span>
            <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chart 3 — Top Error Endpoints (horizontal bar) ──────────────────────────
function TopEndpointsChart({ data }: { data: DashboardStats['topEndpoints'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    chart.current?.destroy();
    chart.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: data.map(d => d.endpoint),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: '#F8717133',
          borderColor: '#F87171',
          borderWidth: 1,
          borderRadius: { topRight: 2, bottomRight: 2 },
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: '#18181B', borderColor: '#27272A', borderWidth: 1,
            titleColor: '#FAFAFA', bodyColor: '#A1A1AA', padding: 10,
          },
          legend: { display: false },
        },
        scales: {
          x: { grid: { color: '#1C1C1F' }, ticks: { color: '#52525B' }, beginAtZero: true },
          y: {
            grid: { display: false },
            ticks: {
              color: '#A1A1AA',
              font: { family: "'SF Mono','ui-monospace','Cascadia Code',monospace", size: 10 },
            },
          },
        },
      },
    });
    return () => chart.current?.destroy();
  }, [data]);

  const height = Math.max(120, data.length * 28);
  if (data.length === 0) return <EmptyChart label="No errors recorded" />;
  return <div style={{ height }}><canvas ref={ref} /></div>;
}

// ─── Chart 4 — Response Time Distribution (bar) ───────────────────────────────
function ResponseTimeBuckets({ data }: { data: DashboardStats['responseTimeBuckets'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);

  const bucketColors = ['#4ADE80', '#4ADE80', '#FBBF24', '#F87171', '#F87171'];

  useEffect(() => {
    if (!ref.current) return;
    chart.current?.destroy();
    chart.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: bucketColors.map(c => c + '33'),
          borderColor: bucketColors,
          borderWidth: 1,
          borderRadius: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: '#18181B', borderColor: '#27272A', borderWidth: 1,
            titleColor: '#FAFAFA', bodyColor: '#A1A1AA', padding: 10,
          },
          legend: { display: false },
        },
        scales: {
          x: { grid: { color: '#1C1C1F' }, ticks: { color: '#52525B' } },
          y: { grid: { color: '#1C1C1F' }, ticks: { color: '#52525B' }, beginAtZero: true },
        },
      },
    });
    return () => chart.current?.destroy();
  }, [data]);

  return <div style={{ height: 150 }}><canvas ref={ref} /></div>;
}

// ─── Chart 5 — DB Query Performance (bar) ────────────────────────────────────
function DBQueryChart({ data }: { data: DashboardStats['dbQueryPerf'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    chart.current?.destroy();
    chart.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: data.map(d => d.table),
        datasets: [{
          data: data.map(d => d.avgMs),
          backgroundColor: data.map(d =>
            d.avgMs > 500 ? '#F8717133' : d.avgMs > 100 ? '#FBBF2433' : '#60A5FA33',
          ),
          borderColor: data.map(d =>
            d.avgMs > 500 ? '#F87171' : d.avgMs > 100 ? '#FBBF24' : '#60A5FA',
          ),
          borderWidth: 1,
          borderRadius: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: '#18181B', borderColor: '#27272A', borderWidth: 1,
            titleColor: '#FAFAFA', bodyColor: '#A1A1AA', padding: 10,
            callbacks: { label: (ctx) => ` ${ctx.parsed.y}ms avg` },
          },
          legend: { display: false },
        },
        scales: {
          x: { grid: { color: '#1C1C1F' }, ticks: { color: '#52525B' } },
          y: {
            grid: { color: '#1C1C1F' }, ticks: { color: '#52525B' },
            beginAtZero: true,
            title: { display: true, text: 'avg ms', color: '#52525B', font: { size: 10 } },
          },
        },
      },
    });
    return () => chart.current?.destroy();
  }, [data]);

  if (data.length === 0) return <EmptyChart label="No DB queries captured yet" />;
  return <div style={{ height: 150 }}><canvas ref={ref} /></div>;
}

// ─── Empty chart placeholder ──────────────────────────────────────────────────
function EmptyChart({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 100, border: '1px dashed var(--border)', borderRadius: 6,
      color: 'var(--text3)', fontSize: 12,
    }}>
      {label}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, trendEl, trendLabel, color }: {
  label: string; value: string; trendEl: React.ReactNode;
  trendLabel: string; color: string;
}) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color, lineHeight: 1, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
        {trendEl}
        <span>{trendLabel}</span>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [range, setRange] = useState<Range>('7d');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStats(range);
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  return (
    <div
      className="panel-enter"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 24px',
        overflowY: 'auto',
        gap: 16,
        background: 'var(--bg)',
      }}
    >
      {/* ── Header ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>Production health and error analytics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={load}
            title="Refresh"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <RefreshCw size={12} style={loading ? { animation: 'spin 0.8s linear infinite' } : {}} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <div className="tab-list">
            {(['24h', '7d', '30d'] as Range[]).map(r => (
              <button key={r} className={`tab${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--red-dim)', border: '1px solid #7F0000',
          borderRadius: 6, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--red)',
        }}>
          <AlertCircle size={14} />
          Failed to load stats: {error}
        </div>
      )}

      {stats && (
        <>
          {/* ── Stat Cards ─────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <StatCard
              label="Total Replays"
              value={stats.totalReplays.toLocaleString()}
              trendEl={trendIcon(stats.totalReplays, stats.prevTotalReplays)}
              trendLabel={trendLabel(stats.totalReplays, stats.prevTotalReplays)}
              color="var(--blue)"
            />
            <StatCard
              label="Error Rate"
              value={`${stats.errorRate}%`}
              trendEl={trendIcon(stats.errorRate, stats.prevErrorRate, true)}
              trendLabel={trendLabel(stats.errorRate, stats.prevErrorRate)}
              color={stats.errorRate > 10 ? 'var(--red)' : stats.errorRate > 5 ? 'var(--amber)' : 'var(--text)'}
            />
            <StatCard
              label="Avg Resolve Time"
              value={stats.avgResolveTime > 0 ? `${stats.avgResolveTime}m` : '—'}
              trendEl={<Activity size={11} />}
              trendLabel="time to first view"
              color="var(--green)"
            />
            <StatCard
              label="P95 Response Time"
              value={stats.p95ResponseTime > 0 ? `${stats.p95ResponseTime}ms` : '—'}
              trendEl={trendIcon(stats.p95ResponseTime, stats.prevP95ResponseTime, true)}
              trendLabel={trendLabel(stats.p95ResponseTime, stats.prevP95ResponseTime)}
              color={stats.p95ResponseTime > 1000 ? 'var(--red)' : stats.p95ResponseTime > 500 ? 'var(--amber)' : 'var(--text)'}
            />
          </div>

          {/* ── Row 1: Line + Doughnut ────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <ChartPanel title="Replays Over Time" subtitle="Total captures vs errors">
              <ReplayLineChart data={stats.replaysByDay} />
            </ChartPanel>
            <ChartPanel title="By Trigger Type" subtitle="Breakdown of capture triggers">
              <TriggerDoughnut data={stats.triggerBreakdown} />
            </ChartPanel>
          </div>

          {/* ── Row 2: 3 charts ──────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <ChartPanel title="Top Error Endpoints" subtitle="Most frequent error sources">
              <TopEndpointsChart data={stats.topEndpoints} />
            </ChartPanel>
            <ChartPanel title="Response Time Distribution" subtitle="Requests by latency bucket">
              <ResponseTimeBuckets data={stats.responseTimeBuckets} />
            </ChartPanel>
            <ChartPanel title="DB Query Performance" subtitle="Average time by table">
              <DBQueryChart data={stats.dbQueryPerf} />
            </ChartPanel>
          </div>
        </>
      )}

      {loading && !stats && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, color: 'var(--text3)', fontSize: 13 }}>
          <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
          Loading dashboard…
        </div>
      )}
    </div>
  );
}
