import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ReplayList from './pages/ReplayList';
import ReplayViewer from './pages/ReplayViewer';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        background: 'var(--pr-depth-0)',
        overflow: 'hidden',
      }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/replays" replace />} />
            <Route path="/replays" element={<ReplayList />} />
            <Route path="/replays/:id" element={<ReplayViewer />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
