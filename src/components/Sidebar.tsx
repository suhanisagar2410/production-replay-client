import { NavLink, useLocation } from 'react-router-dom';
import { LayoutList, Settings, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const navItems = [
    { path: '/replays', icon: LayoutList, label: 'Replays' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside
      className="elevation-1"
      style={{
        width: collapsed ? 56 : 200,
        minWidth: collapsed ? 56 : 200,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 250ms var(--ease-smooth), min-width 250ms var(--ease-smooth)',
        borderRight: '0.5px solid var(--pr-border-soft)',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '16px 12px' : '20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '0.5px solid var(--pr-border-subtle)',
          minHeight: 60,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--pr-accent-primary), #818CF8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px var(--pr-accent-glow)',
            flexShrink: 0,
          }}
        >
          <Zap size={16} color="#fff" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--pr-text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              Production
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 11,
              color: 'var(--pr-accent-primary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Replay
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '8px 12px' : '8px 12px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: isActive ? 'var(--pr-text-primary)' : 'var(--pr-text-tertiary)',
                background: isActive ? 'var(--pr-depth-3)' : 'transparent',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 150ms var(--ease-smooth)',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--pr-text-secondary)';
                  e.currentTarget.style.background = 'var(--pr-depth-2)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--pr-text-tertiary)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <item.icon size={16} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          right: -12,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 24,
          height: 24,
          borderRadius: 'var(--radius-full)',
          background: 'var(--pr-depth-3)',
          border: '0.5px solid var(--pr-border-medium)',
          color: 'var(--pr-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 150ms',
        }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* User Profile */}
      <div style={{
        padding: collapsed ? '12px 8px' : '16px',
        borderTop: '0.5px solid var(--pr-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {user ? (
          <>
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              style={{
                width: collapsed ? 24 : 32,
                height: collapsed ? 24 : 32,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--pr-border-medium)',
                flexShrink: 0,
                margin: collapsed ? '0 auto' : '0'
              }}
            />
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--pr-text-primary)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  {user.name}
                </div>
                <div style={{
                  fontSize: 11,
                  color: 'var(--pr-text-tertiary)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  {user.email}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            fontSize: 11,
            color: 'var(--pr-text-tertiary)',
            fontFamily: 'var(--font-code)',
            textAlign: collapsed ? 'center' : 'left',
            width: '100%'
          }}>
            {!collapsed ? 'Loading profile...' : '...'}
          </div>
        )}
      </div>
    </aside>
  );
}
