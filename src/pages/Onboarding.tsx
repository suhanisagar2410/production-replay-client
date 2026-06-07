import { useState, useEffect } from 'react';
import { Terminal, CheckCircle2, Code, Loader2 } from 'lucide-react';
import { useReplayStore } from '../store/replayStore';
import { fetchProjects } from '../api';

export default function Onboarding() {
  const [apiKey, setApiKey] = useState<string>('');
  const { replays } = useReplayStore();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchProjects().then(data => {
      if (data && data.length > 0) {
        setApiKey(data[0].apiKey);
      }
    });
  }, []);

  useEffect(() => {
    if (replays.length > 0) {
      setShowConfetti(true);
    }
  }, [replays.length]);

  if (showConfetti) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 40, textAlign: 'center', background: 'var(--pr-depth-0)'
      }}>
        <div style={{ marginBottom: 24, animation: 'bounce 1s infinite' }}>
          <CheckCircle2 size={64} color="var(--pr-success)" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
          You're all set!
        </h1>
        <p style={{ color: 'var(--pr-text-secondary)', fontSize: 16, maxWidth: 400, marginBottom: 32 }}>
          We've successfully received your first replay. You are now ready to debug production errors like a pro.
        </p>
        <button 
          className="btn btn-primary"
          onClick={() => window.location.reload()}
          style={{ padding: '12px 24px', fontSize: 16 }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="panel-enter" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: '40px', maxWidth: 800, margin: '0 auto', width: '100%'
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
        marginBottom: 8, color: 'var(--pr-text-primary)'
      }}>
        Welcome to Production Replay
      </h1>
      <p style={{ color: 'var(--pr-text-secondary)', fontSize: 15, marginBottom: 40 }}>
        Let's get your flight recorder installed. It takes less than 2 minutes.
      </p>

      <div className="elevation-2" style={{
        background: 'var(--pr-depth-1)', border: '1px solid var(--pr-border-soft)',
        borderRadius: 'var(--radius-lg)', padding: 32, marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--pr-accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>1</div>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Install the SDK</h2>
        </div>
        <pre style={{
          background: 'var(--pr-depth-0)', padding: 16, borderRadius: 'var(--radius-md)',
          border: '1px solid var(--pr-border-medium)', color: 'var(--pr-event-function)',
          fontFamily: 'var(--font-code)', fontSize: 14
        }}>
          npm install production-replay
        </pre>
      </div>

      <div className="elevation-2" style={{
        background: 'var(--pr-depth-1)', border: '1px solid var(--pr-border-soft)',
        borderRadius: 'var(--radius-lg)', padding: 32, marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--pr-accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>2</div>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Initialize in your app</h2>
        </div>
        <p style={{ fontSize: 14, color: 'var(--pr-text-secondary)', marginBottom: 16 }}>
          Add this to the very top of your application entry point (e.g. <code>index.js</code> or <code>server.ts</code>).
        </p>
        <pre style={{
          background: 'var(--pr-depth-0)', padding: 16, borderRadius: 'var(--radius-md)',
          border: '1px solid var(--pr-border-medium)', color: 'var(--pr-text-secondary)',
          fontFamily: 'var(--font-code)', fontSize: 14, lineHeight: 1.6
        }}>
{`const replay = require('production-replay');

replay.init({
  apiKey: '${apiKey || 'Loading...'}',
  serviceName: 'my-node-service',
  environment: 'development'
});`}
        </pre>
      </div>

      <div className="elevation-2" style={{
        background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: 'var(--radius-lg)', padding: 32, display: 'flex', alignItems: 'center', gap: 24
      }}>
        <Loader2 size={32} className="spin" color="var(--pr-accent-primary)" />
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--pr-accent-primary)', marginBottom: 4 }}>
            Waiting for your first replay...
          </h2>
          <p style={{ fontSize: 14, color: 'var(--pr-text-secondary)', margin: 0 }}>
            Start your app and intentionally trigger an error. This page will automatically update when we receive it.
          </p>
        </div>
      </div>
    </div>
  );
}
