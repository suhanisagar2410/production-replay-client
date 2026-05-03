import { useState } from 'react';
import { Key, Copy, Check, Code, Shield, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const [copied, setCopied] = useState(false);
  const apiKey = 'pr_live_sk_a8f3e2d1c4b567890abcdef123456789';

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="panel-enter" style={{ height: '100%', overflow: 'auto', padding: '24px 32px', maxWidth: 720 }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 'var(--type-display-xl)', fontWeight: 700,
        color: 'var(--pr-text-primary)', marginBottom: 6,
      }}>
        Project Settings
      </h1>
      <p style={{ fontSize: 'var(--type-body-sm)', color: 'var(--pr-text-secondary)', marginBottom: 32 }}>
        Configure your Production Replay SDK and project settings
      </p>

      {/* API Key */}
      <div className="elevation-2" style={{ borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Key size={16} color="var(--pr-accent-primary)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>API Key</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--pr-depth-1)', padding: '8px 12px',
          borderRadius: 'var(--radius-md)', border: '0.5px solid var(--pr-border-soft)',
        }}>
          <code style={{ fontFamily: 'var(--font-code)', fontSize: 12, color: 'var(--pr-text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {apiKey}
          </code>
          <button className="btn btn-ghost btn-xs" onClick={copyKey} style={{ gap: 4 }}>
            {copied ? <><Check size={12} color="var(--pr-success)" /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--pr-text-tertiary)', marginTop: 8 }}>
          This key authenticates your SDK with the Production Replay API. Keep it secret.
        </p>
      </div>

      {/* SDK Install */}
      <div className="elevation-2" style={{ borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Code size={16} color="var(--pr-event-function)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>Install SDK</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pr-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Step 1 — Install
          </div>
          <pre style={{
            fontFamily: 'var(--font-code)', fontSize: 13, color: 'var(--pr-event-function)',
            background: 'var(--pr-depth-1)', padding: 12, borderRadius: 'var(--radius-md)',
            border: '0.5px solid var(--pr-border-soft)',
          }}>
            npm install production-replay
          </pre>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pr-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Step 2 — Initialize
          </div>
          <pre style={{
            fontFamily: 'var(--font-code)', fontSize: 13, color: 'var(--pr-text-secondary)',
            background: 'var(--pr-depth-1)', padding: 12, borderRadius: 'var(--radius-md)',
            border: '0.5px solid var(--pr-border-soft)', lineHeight: 1.6,
          }}>
{`const replay = require('production-replay');

replay.init({
  apiKey: '${apiKey}'
});

// That's it. Full recording starts immediately.`}
          </pre>
        </div>
      </div>

      {/* Redaction Rules */}
      <div className="elevation-2" style={{ borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Shield size={16} color="var(--pr-success)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>Data Redaction</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--pr-text-secondary)', marginBottom: 12 }}>
          Fields matching these patterns will be replaced with [REDACTED] before leaving your server.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['password', 'token', 'secret', 'authorization', 'cookie', 'ssn', 'credit_card'].map(field => (
            <div key={field} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', background: 'var(--pr-depth-1)',
              borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--pr-border-soft)',
            }}>
              <AlertTriangle size={12} color="var(--pr-warning)" />
              <code style={{ fontFamily: 'var(--font-code)', fontSize: 12, color: 'var(--pr-text-secondary)' }}>
                {field}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{
        borderRadius: 'var(--radius-lg)', padding: 20,
        background: 'var(--pr-danger-bg)',
        border: '0.5px solid rgba(239,68,68,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <AlertTriangle size={16} color="var(--pr-danger)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--pr-danger)' }}>
            Danger Zone
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--pr-text-primary)', marginBottom: 2 }}>Regenerate API Key</div>
            <div style={{ fontSize: 12, color: 'var(--pr-text-tertiary)' }}>This will invalidate the current key</div>
          </div>
          <button className="btn btn-danger btn-sm">Regenerate</button>
        </div>
      </div>
    </div>
  );
}
