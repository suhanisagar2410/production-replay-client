import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import SearchModal from './components/SearchModal';
import Sidebar from './components/Sidebar';
import ReplayList from './pages/ReplayList';
import ReplayViewer from './pages/ReplayViewer';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { fetchMe } from './api';
import Landing from './pages/Landing';

// A wrapper component that forces users to login
function AuthGuard({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const login = useAuthStore((state) => state.login);
  const setUser = useAuthStore((state) => state.setUser);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for session_token in URL (GitHub OAuth redirect)
    const params = new URLSearchParams(location.search);
    const token = params.get('session_token');
    if (token) {
      login(token);
      navigate(location.pathname, { replace: true });
    }
  }, [location, login, navigate]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMe().then((data) => {
        if (data.user) setUser(data.user);
      }).catch((err) => {
        console.error('Failed to fetch user profile', err);
      });
    }
  }, [isLoggedIn, setUser]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Protected layout — sidebar + main content
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let gPressed = false;
    let gTimeout: number | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't run shortcuts if inside input or textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Cmd+K or Ctrl+K toggle search modal
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }

      // G -> D / G -> R navigation
      if (e.key === 'g' || e.key === 'G') {
        gPressed = true;
        if (gTimeout) clearTimeout(gTimeout);
        gTimeout = window.setTimeout(() => {
          gPressed = false;
        }, 1000);
        return;
      }

      if (gPressed) {
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          navigate('/dashboard');
          gPressed = false;
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          navigate('/replays');
          gPressed = false;
        } else {
          gPressed = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gTimeout) clearTimeout(gTimeout);
    };
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {children}
      </main>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <AuthGuard>
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          </AuthGuard>
        } />

        <Route path="/replays" element={
          <AuthGuard>
            <ProtectedLayout>
              <ReplayList />
            </ProtectedLayout>
          </AuthGuard>
        } />

        <Route path="/replays/:id" element={
          <AuthGuard>
            <ProtectedLayout>
              <ReplayViewer />
            </ProtectedLayout>
          </AuthGuard>
        } />

        <Route path="/shared/:shareToken" element={
          <ProtectedLayout>
            <ReplayViewer />
          </ProtectedLayout>
        } />

        <Route path="/settings" element={
          <AuthGuard>
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          </AuthGuard>
        } />

        {/* Catch-all — redirect logged-in users to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
