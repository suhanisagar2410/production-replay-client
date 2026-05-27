import { useState, useEffect } from 'react';
import { Key, Copy, Check, Code, Plus, FolderSync, ChevronRight, Search, User, LogOut, Mail, Calendar } from 'lucide-react';
import { fetchProjects, createProject, fetchMe } from '../api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const [copied, setCopied] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // If activeProjectId is null, we assume we are showing the Profile page
  const [activeTab, setActiveTab] = useState<'profile' | 'project'>('profile');

  useEffect(() => {
    fetchProjects().then(data => {
      setProjects(data);
    });
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const apiKey = activeProject ? activeProject.apiKey : '';

  const copyKey = () => {
    if (!activeProject) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);
    try {
      const p = await createProject(newProjectName);
      setProjects([...projects, p]);
      setActiveProjectId(p.id);
      setActiveTab('project');
      setNewProjectName('');
      setSearchQuery('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const token = useAuthStore.getState().token;
      await fetch(`${baseUrl}/logout`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {}
    logout();
    navigate('/login');
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="panel-enter" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ padding: '32px 32px 16px', borderBottom: '1px solid var(--pr-border-soft)' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'var(--type-display-xl)', fontWeight: 700,
          color: 'var(--pr-text-primary)', marginBottom: 6,
        }}>
          Settings
        </h1>
        <p style={{ fontSize: 'var(--type-body-sm)', color: 'var(--pr-text-secondary)', margin: 0 }}>
          Manage your account and project SDK integrations
        </p>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar */}
        <div style={{ 
          width: 280, 
          borderRight: '1px solid var(--pr-border-soft)',
          background: 'var(--pr-depth-0)',
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          
          <div style={{ padding: '16px' }}>
            <button 
              onClick={() => setActiveTab('profile')}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                borderColor: activeTab === 'profile' ? 'var(--pr-border-medium)' : 'transparent',
                background: activeTab === 'profile' ? 'var(--pr-depth-1)' : 'transparent',
                color: activeTab === 'profile' ? 'var(--pr-text-primary)' : 'var(--pr-text-secondary)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'profile' ? 600 : 500,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'profile' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <User size={16} color={activeTab === 'profile' ? 'var(--pr-accent-primary)' : 'var(--pr-text-tertiary)'} />
              Account Profile
            </button>
          </div>

          <div style={{ padding: '8px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderSync size={16} color="var(--pr-text-tertiary)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--pr-text-tertiary)' }}>
              Projects
            </span>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--pr-text-tertiary)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--pr-border-soft)',
                  background: 'var(--pr-depth-1)',
                  color: 'var(--pr-text-primary)',
                  fontSize: 13
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, padding: '0 12px' }}>
            {filteredProjects.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--pr-text-tertiary)', fontSize: 13 }}>
                {searchQuery ? 'No projects matched.' : 'No projects yet.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredProjects.map(p => {
                  const isActive = activeTab === 'project' && p.id === activeProjectId;
                  return (
                    <button 
                      key={p.id}
                      onClick={() => { setActiveProjectId(p.id); setActiveTab('project'); }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        color: isActive ? 'var(--pr-text-primary)' : 'var(--pr-text-secondary)',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        if(!isActive) e.currentTarget.style.background = 'var(--pr-depth-1)';
                      }}
                      onMouseLeave={e => {
                        if(!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                      {isActive && <ChevronRight size={14} color="var(--pr-accent-primary)" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid var(--pr-border-soft)', background: 'var(--pr-depth-0)' }}>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input 
                type="text" 
                placeholder="New project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--pr-border-soft)',
                  background: 'var(--pr-depth-1)',
                  color: 'var(--pr-text-primary)',
                  fontSize: 13
                }}
              />
              <button 
                type="submit" 
                disabled={creating || !newProjectName.trim()}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--pr-text-primary)',
                  color: 'var(--pr-depth-0)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: (creating || !newProjectName.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (creating || !newProjectName.trim()) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'opacity 0.2s'
                }}
              >
                <Plus size={14} /> {creating ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side - Content */}
        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          
          {activeTab === 'profile' && user && (
            <div style={{ maxWidth: 500 }} className="stagger-item">
              <h2 style={{ fontSize: 24, color: 'var(--pr-text-primary)', marginBottom: 32, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--pr-border-soft)' }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--pr-accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {user.name}
              </h2>

              <div className="elevation-2" style={{ borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24, background: 'var(--pr-depth-1)', border: '1px solid var(--pr-border-soft)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--pr-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={16} color="var(--pr-text-tertiary)" />
                  Personal Information
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--pr-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Full Name</label>
                    <div style={{ fontSize: 14, color: 'var(--pr-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {user.name}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--pr-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Email Address</label>
                    <div style={{ fontSize: 14, color: 'var(--pr-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Mail size={14} color="var(--pr-text-tertiary)" /> {user.email}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--pr-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Member Since</label>
                    <div style={{ fontSize: 14, color: 'var(--pr-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={14} color="var(--pr-text-tertiary)" /> {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="elevation-2" style={{ borderRadius: 'var(--radius-lg)', padding: 24, background: 'var(--pr-depth-1)', border: '1px solid var(--pr-border-soft)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--pr-text-primary)' }}>Danger Zone</h3>
                <p style={{ fontSize: 13, color: 'var(--pr-text-tertiary)', marginBottom: 20 }}>
                  Log out of your current session. You will need to re-authenticate to access your projects.
                </p>
                <button 
                  onClick={handleLogout}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--pr-danger-bg)',
                    color: 'var(--pr-danger)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--pr-danger-bg)'}
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          )}

          {activeTab === 'project' && activeProject && (
            <div style={{ maxWidth: 600 }} className="stagger-item">
              <h2 style={{ fontSize: 24, color: 'var(--pr-text-primary)', marginBottom: 32, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                <FolderSync size={24} color="var(--pr-accent-primary)" />
                {activeProject.name}
              </h2>

              {/* API Key */}
              <div className="elevation-2" style={{ borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24, background: 'var(--pr-depth-1)', border: '1px solid var(--pr-border-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Key size={16} color="var(--pr-warning)" />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>API Key</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--pr-depth-0)', padding: '10px 14px',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--pr-border-medium)',
                }}>
                  <code style={{ fontFamily: 'var(--font-code)', fontSize: 13, color: 'var(--pr-text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {apiKey}
                  </code>
                  <button className="btn btn-ghost btn-xs" onClick={copyKey} style={{ gap: 4 }}>
                    {copied ? <><Check size={12} color="var(--pr-success)" /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--pr-text-tertiary)', marginTop: 12 }}>
                  This key authenticates your SDK with the Production Replay API. Keep it secret.
                </p>
              </div>

              {/* SDK Install */}
              <div className="elevation-2" style={{ borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24, background: 'var(--pr-depth-1)', border: '1px solid var(--pr-border-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Code size={16} color="var(--pr-event-function)" />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>Install SDK</span>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pr-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Step 1 — Install
                  </div>
                  <pre style={{
                    fontFamily: 'var(--font-code)', fontSize: 13, color: 'var(--pr-event-function)',
                    background: 'var(--pr-depth-0)', padding: 14, borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--pr-border-medium)',
                  }}>
                    npm install production-replay
                  </pre>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pr-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Step 2 — Initialize
                  </div>
                  <pre style={{
                    fontFamily: 'var(--font-code)', fontSize: 13, color: 'var(--pr-text-secondary)',
                    background: 'var(--pr-depth-0)', padding: 14, borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--pr-border-medium)', lineHeight: 1.6,
                  }}>
{`const replay = require('production-replay');

replay.init({
  apiKey: '${apiKey}'
});

// That's it. Full recording starts immediately.`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
