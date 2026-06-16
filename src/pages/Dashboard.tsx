import { useEffect, useState } from 'react';
import { Activity, AlertCircle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCard {
  label: string;
  value: string;
  secondary: string;
  trend: 'up' | 'down' | 'neutral';
  trendGood: boolean; // is this trend direction a good thing?
  color: string;
}

// ─── Stat Card Component ──────────────────────────────────────────────────────
function StatCardItem({ card }: { card: StatCard }) {
  const TrendIcon = card.trend === 'up' ? TrendingUp : card.trend === 'down' ? TrendingDown : Minus;
  const trendColor = card.trend === 'neutral' ? 'var(--text3)'
    : card.trendGood === (card.trend === 'down') ? 'var(--green)' : 'var(--red)';

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {card.label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: card.color, lineHeight: 1, marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>
        {card.value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: trendColor }}>
        <TrendIcon size={12} />
        <span>{card.secondary}</span>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [stats, setStats] = useState({
    totalReplays: 0,
    errorRate: 0,
    avgResolveTime: 0,
    p95ResponseTime: 0,
  });

  // Placeholder stats — will be wired to real API in next phase
  useEffect(() => {
    // TODO: Fetch from /api/projects/:id/stats
    setStats({
      totalReplays: 0,
      errorRate: 0,
      avgResolveTime: 0,
      p95ResponseTime: 0,
    });
  }, [timeRange]);

  const statCards: StatCard[] = [
    {
      label: 'Total Replays',
      value: stats.totalReplays.toLocaleString(),
      secondary: 'this period',
      trend: 'neutral',
      trendGood: true,
      color: 'var(--blue)',
    },
    {
      label: 'Error Rate',
      value: `${stats.errorRate.toFixed(1)}%`,
      secondary: 'of all requests',
      trend: stats.errorRate === 0 ? 'neutral' : 'up',
      trendGood: false,
      color: stats.errorRate > 5 ? 'var(--red)' : 'var(--text)',
    },
    {
      label: 'Avg Resolve Time',
      value: `${stats.avgResolveTime}m`,
      secondary: 'time to first view',
      trend: 'neutral',
      trendGood: true,
      color: stats.avgResolveTime > 60 ? 'var(--amber)' : 'var(--green)',
    },
    {
      label: 'P95 Response Time',
      value: `${stats.p95ResponseTime}ms`,
      secondary: 'vs last deploy',
      trend: 'neutral',
      trendGood: true,
      color: stats.p95ResponseTime > 1000 ? 'var(--red)' : stats.p95ResponseTime > 500 ? 'var(--amber)' : 'var(--text)',
    },
  ];

  return (
    <div
      className="panel-enter"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 24px',
        overflowY: 'auto',
        gap: 20,
      }}
    >
      {/* ── Header ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>
            Production health and error analytics
          </p>
        </div>

        {/* Time range selector */}
        <div className="tab-list">
          {(['24h', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              className={`tab${timeRange === r ? ' active' : ''}`}
              onClick={() => setTimeRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat Cards Row ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {statCards.map((card) => (
          <StatCardItem key={card.label} card={card} />
        ))}
      </div>

      {/* ── Charts Placeholder ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        {/* Chart 1: Replays Over Time */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '16px 18px', minHeight: 220,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Replays Over Time</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Total captures vs errors</div>
          <ChartPlaceholder label="Line chart coming in Phase 2" icon={<Activity size={20} />} />
        </div>

        {/* Chart 2: By Trigger Type */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '16px 18px', minHeight: 220,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>By Trigger Type</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>CRASH / HTTP / MANUAL / SLOW</div>
          <ChartPlaceholder label="Doughnut chart coming in Phase 2" icon={<AlertCircle size={20} />} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {/* Chart 3: Top Error Endpoints */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '16px 18px', minHeight: 180,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Top Error Endpoints</div>
          <ChartPlaceholder label="Horizontal bar coming in Phase 2" icon={<AlertCircle size={18} />} />
        </div>

        {/* Chart 4: Response Time Distribution */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '16px 18px', minHeight: 180,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Response Time Distribution</div>
          <ChartPlaceholder label="Bucket bar chart coming in Phase 2" icon={<Clock size={18} />} />
        </div>

        {/* Chart 5: DB Query Performance */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '16px 18px', minHeight: 180,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>DB Query Performance</div>
          <ChartPlaceholder label="Query time by table coming in Phase 2" icon={<Activity size={18} />} />
        </div>
      </div>
    </div>
  );
}

// ─── Chart Placeholder ────────────────────────────────────────────────────────
function ChartPlaceholder({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: 100,
      color: 'var(--text3)',
      gap: 8,
      border: '1px dashed var(--border)',
      borderRadius: 6,
      padding: 16,
    }}>
      {icon}
      <span style={{ fontSize: 12, textAlign: 'center' }}>{label}</span>
    </div>
  );
}
