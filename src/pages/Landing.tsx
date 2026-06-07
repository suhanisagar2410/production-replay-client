import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Terminal, Clock, Shield, Zap, ChevronRight, PlayCircle, Lock } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    // Check for session_token in URL (GitHub/Google redirect)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('session_token');
    
    if (token) {
      login(token, null);
      navigate('/replays', { replace: true });
    } else if (isLoggedIn) {
      navigate('/replays', { replace: true });
    }
  }, [isLoggedIn, login, navigate]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--pr-depth-0)',
      color: 'var(--pr-text-primary)',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Navigation */}
      <nav style={{
        padding: '24px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--pr-border-soft)',
        background: 'rgba(9, 9, 11, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Terminal size={24} color="var(--pr-accent-primary)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Production<span style={{ color: 'var(--pr-accent-primary)' }}>Replay</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => navigate('/login')}
            style={{ fontWeight: 600 }}
          >
            Log in
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleGetStarted}
            style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)' }}
          >
            Start for free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '120px 24px 80px', textAlign: 'center' }}>
        
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '6px 16px', borderRadius: 'var(--radius-full)',
          color: 'var(--pr-accent-primary)', fontSize: 13, fontWeight: 600,
          marginBottom: 32, letterSpacing: '0.02em'
        }}>
          <span className="pulse-dot" style={{ width: 8, height: 8, background: 'var(--pr-accent-primary)', borderRadius: '50%' }}></span>
          Public Beta is now live
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 6vw, 72px)', 
          fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em',
          maxWidth: 900, marginBottom: 24,
          background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Time-travel debugger for <br />Node.js production bugs.
        </h1>
        
        <p style={{
          fontSize: 'clamp(18px, 2vw, 22px)', color: 'var(--pr-text-secondary)',
          maxWidth: 700, marginBottom: 48, lineHeight: 1.6
        }}>
          Instead of adding logs and waiting for a bug to happen again, replay exactly what happened — every function call, variable value, and DB query from the 30 minutes before the error.
        </p>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={handleGetStarted}
            style={{
              padding: '16px 32px', fontSize: 18, fontWeight: 600,
              background: 'var(--pr-accent-primary)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(99, 102, 241, 0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(99, 102, 241, 0.4)';
            }}
          >
            Start your free trial <ChevronRight size={20} />
          </button>
          
          <button 
            style={{
              padding: '16px 32px', fontSize: 18, fontWeight: 600,
              background: 'var(--pr-depth-1)', color: 'var(--pr-text-primary)',
              border: '1px solid var(--pr-border-soft)', borderRadius: 'var(--radius-md)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--pr-depth-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--pr-depth-1)'}
          >
            <PlayCircle size={20} /> Watch Demo
          </button>
        </div>

        <div style={{ marginTop: 32, fontSize: 14, color: 'var(--pr-text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={14} /> No credit card required. 2-minute setup.
        </div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 32, width: '100%', maxWidth: 1100, marginTop: 120, textAlign: 'left'
        }}>
          
          <div style={{ background: 'var(--pr-depth-1)', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--pr-border-soft)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Clock size={24} color="var(--pr-accent-primary)" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-display)' }}>Never write `console.log` again</h3>
            <p style={{ color: 'var(--pr-text-secondary)', lineHeight: 1.6 }}>We automatically capture the full execution context of your application. When an error hits, you get the complete stack trace, local variables, and network requests leading up to it.</p>
          </div>

          <div style={{ background: 'var(--pr-depth-1)', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--pr-border-soft)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Zap size={24} color="#10b981" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-display)' }}>Zero-overhead recording</h3>
            <p style={{ color: 'var(--pr-text-secondary)', lineHeight: 1.6 }}>Built natively for Node.js using V8 Inspector APIs. The flight recorder runs continuously in the background with near-zero performance overhead until a crash is detected.</p>
          </div>

          <div style={{ background: 'var(--pr-depth-1)', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--pr-border-soft)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Shield size={24} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-display)' }}>Enterprise grade security</h3>
            <p style={{ color: 'var(--pr-text-secondary)', lineHeight: 1.6 }}>All replay data is compressed and encrypted before it leaves your servers. You have full control over data retention policies and what gets captured.</p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '40px 48px',
        borderTop: '1px solid var(--pr-border-soft)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'var(--pr-text-tertiary)',
        fontSize: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Terminal size={18} /> Production Replay Inc. © {new Date().getFullYear()}
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <span style={{ cursor: 'pointer' }}>Documentation</span>
          <span style={{ cursor: 'pointer' }}>Pricing</span>
          <span style={{ cursor: 'pointer' }}>Privacy</span>
          <span style={{ cursor: 'pointer' }}>Terms</span>
        </div>
      </footer>
    </div>
  );
}
