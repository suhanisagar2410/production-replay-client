import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, Zap, Settings, ChevronLeft, ChevronRight, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { fetchProjects } from '../api';
import { useReplayStore } from '../store/replayStore';

const navSections = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/replays',   icon: List,            label: 'Replays' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { activeProjectId, setActiveProjectId } = useReplayStore();

  useEffect(() => {
    fetchProjects().then(data => {
      setProjects(data);
    }).catch(err => {
      console.error('Failed to fetch projects', err);
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isOpen]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const isActive = (path: string) =>
    path === '/replays'
      ? location.pathname.startsWith('/replays')
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const W = collapsed ? 52 : 200;

  return (
    <aside
      style={{
        width: W,
        minWidth: W,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        transition: `width 200ms var(--ease), min-width 200ms var(--ease)`,
        position: 'relative',
        zIndex: 20,
        overflow: 'hidden',
      }}
    >
      {/* ── Logo ─────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '14px 0' : '14px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid var(--border)',
          minHeight: 52,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: 'var(--blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Zap size={13} color="#fff" />
        </div>
        {!collapsed && (
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--text)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}>
            Production Replay
          </span>
        )}
      </div>

      {/* ── Project Switcher ─────────────────── */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            background: 'var(--bg3)',
            border: '1px solid var(--border2)',
            borderRadius: 6,
            color: 'var(--text)',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: 12,
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {/* Health Dot */}
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: activeProject ? (activeProject.isHealthy ? 'var(--green)' : 'var(--red)') : 'var(--green)',
              flexShrink: 0
            }} />
            {!collapsed && (
              <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeProject ? activeProject.name : 'All Projects'}
              </span>
            )}
          </div>
          {!collapsed && <ChevronDown size={12} style={{ color: 'var(--text3)' }} />}
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 12,
            right: 12,
            background: 'var(--bg2)',
            border: '1px solid var(--border2)',
            borderRadius: 6,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
            zIndex: 50,
            maxHeight: 200,
            overflowY: 'auto',
            padding: 4,
          }}>
            {/* All Projects Option */}
            <button
              onClick={() => { setActiveProjectId(null); setIsOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: 4,
                background: !activeProjectId ? 'var(--bg3)' : 'transparent',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: 12,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                <span>All Projects</span>
              </div>
            </button>

            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => { setActiveProjectId(p.id); setIsOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 4,
                  background: activeProjectId === p.id ? 'var(--bg3)' : 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: 12,
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: p.isHealthy ? 'var(--green)' : 'var(--red)',
                    flexShrink: 0
                  }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{p.replayCount}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────── */}
      <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
        {navSections.map((section) => (
          <div key={section.label}>
            {/* Section label */}
            {!collapsed && (
              <div style={{
                fontSize: 11, fontWeight: 500, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '0 6px', marginBottom: 4,
              }}>
                {section.label}
              </div>
            )}
            {/* Nav items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: collapsed ? '6px 0' : '6px 8px',
                      borderRadius: 6,
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
                      color: active ? 'var(--text)' : 'var(--text2)',
                      background: active ? 'var(--bg3)' : 'transparent',
                      border: active ? '1px solid var(--border2)' : '1px solid transparent',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      transition: 'background 120ms, color 120ms, border-color 120ms',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'var(--bg3)';
                        e.currentTarget.style.color = 'var(--text)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text2)';
                      }
                    }}
                  >
                    <item.icon size={15} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Collapse Toggle ───────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute',
          right: -10,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          color: 'var(--text3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 30,
        }}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>

      {/* ── User Footer ──────────────────────── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: collapsed ? '10px 0' : '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        {user ? (
          <>
            <img
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1E3A5F&color=60A5FA&size=64`}
              alt={user.name}
              title={collapsed ? `${user.name} — ${user.email}` : undefined}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--border)',
                flexShrink: 0,
              }}
            />
            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => { logout(); navigate('/login'); }}
                title="Sign out"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center',
                  flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
              >
                <LogOut size={13} />
              </button>
            )}
          </>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            {collapsed ? '...' : 'Loading...'}
          </div>
        )}
      </div>
    </aside>
  );
}
