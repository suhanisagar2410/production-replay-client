import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSocialLogin = (provider: 'github' | 'google') => {
    window.location.href = `${backendUrl}/auth/${provider}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const body = isRegister ? { email, password, name } : { email, password };

    try {
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
      } else {
        login(data.token, data.user);
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--pr-depth-0)' }}>
      
      {/* Left Branding Panel (Hidden on small screens) */}
      <div style={{
        flex: 1,
        display: 'none',
        '@media (minWidth: 768px)': { display: 'flex' },
        position: 'relative',
        background: 'var(--pr-depth-1)',
        borderRight: '1px solid var(--pr-border-soft)',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Abstract background elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
        
        {/* Dot pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}></div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, padding: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--pr-accent-primary) 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--pr-text-primary)' }}>
              Production Replay
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, color: 'var(--pr-text-primary)', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.02em' }}>
            Debug in production <br/><span style={{ color: 'var(--pr-text-tertiary)' }}>without the guesswork.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--pr-text-secondary)', lineHeight: 1.5, maxWidth: 400 }}>
            The ultimate flight recorder for Node.js. Capture full execution context the exact moment a crash occurs.
          </p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          
          {/* Mobile Logo Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, justifyContent: 'center', '@media (minWidth: 768px)': { display: 'none' } } as any}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg, var(--pr-accent-primary) 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--pr-text-primary)' }}>
              Production Replay
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--pr-text-primary)', marginBottom: 8, letterSpacing: '-0.01em' }}>
            {isRegister ? 'Create an account' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--pr-text-secondary)', marginBottom: 32 }}>
            {isRegister ? 'Sign up to start recording your production crashes.' : 'Enter your details to sign in to your workspace.'}
          </p>

          {error && (
            <div style={{ background: 'var(--pr-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--pr-danger)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: 24, fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {isRegister && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--pr-text-secondary)' }}>Full Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--pr-depth-1)', border: '1px solid var(--pr-border-soft)', color: 'var(--pr-text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--pr-text-secondary)' }}>Email address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--pr-depth-1)', border: '1px solid var(--pr-border-soft)', color: 'var(--pr-text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--pr-text-secondary)' }}>Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--pr-depth-1)', border: '1px solid var(--pr-border-soft)', color: 'var(--pr-text-primary)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
              />
            </div>

            <button 
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', marginTop: 8,
                background: 'var(--pr-text-primary)', color: 'var(--pr-depth-0)', border: 'none',
                fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all 0.2s', display: 'flex', justifyContent: 'center'
              }}
            >
              {loading ? 'Processing...' : (isRegister ? 'Sign up' : 'Sign in')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--pr-text-tertiary)', fontSize: 12, fontWeight: 500 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--pr-border-soft)' }}></div>
            <span style={{ padding: '0 12px' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--pr-border-soft)' }}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button 
              type="button" onClick={() => handleSocialLogin('google')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', padding: '10px', background: 'var(--pr-depth-1)', color: 'var(--pr-text-primary)',
                border: '1px solid var(--pr-border-soft)', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--pr-depth-2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--pr-depth-1)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <button 
              type="button" onClick={() => handleSocialLogin('github')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', padding: '10px', background: 'var(--pr-depth-1)', color: 'var(--pr-text-primary)',
                border: '1px solid var(--pr-border-soft)', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--pr-depth-2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--pr-depth-1)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              Continue with GitHub
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <p style={{ color: 'var(--pr-text-secondary)', fontSize: 13 }}>
              {isRegister ? "Already have an account? " : "Don't have an account? "}
              <button 
                onClick={() => setIsRegister(!isRegister)}
                style={{ background: 'none', border: 'none', color: 'var(--pr-text-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                {isRegister ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
