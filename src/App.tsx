import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Sidebar from './components/Sidebar';
import ReplayList from './pages/ReplayList';
import ReplayViewer from './pages/ReplayViewer';
import Settings from './pages/Settings';
import Login from './pages/Login';

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
    // Check for session_token in URL (GitHub redirect)
    const params = new URLSearchParams(location.search);
    const token = params.get('session_token');
    
    if (token) {
      login(token);
      // Clean up the URL by removing the query param
      navigate(location.pathname, { replace: true });
    }
  }, [location, login, navigate]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchMe().then((data) => {
        if (data.user) setUser(data.user);
      }).catch(err => {
        console.error("Failed to fetch user profile", err);
      });
    }
  }, [isLoggedIn, setUser]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Protected layout with the sidebar
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: 'var(--pr-depth-0)',
      overflow: 'hidden',
    }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
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
        
        <Route path="/settings" element={
          <AuthGuard>
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          </AuthGuard>
        } />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
