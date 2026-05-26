import { useState, useEffect } from 'react';
import { Key, Copy, Check, Code, Shield, AlertTriangle, Plus, FolderSync, ChevronRight, Search } from 'lucide-react';
import { fetchProjects, createProject } from '../api';

export default function Settings() {
  const [copied, setCopied] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects().then(data => {
      setProjects(data);
      if (data.length > 0) setActiveProjectId(data[0].id);
    });
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const apiKey = activeProject ? activeProject.apiKey : 'Create a project first...';

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
      setNewProjectName('');
      setSearchQuery('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
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
          Projects & Settings
        </h1>
        <p style={{ fontSize: 'var(--type-body-sm)', color: 'var(--pr-text-secondary)', margin: 0 }}>
          Manage your projects and API keys for the SDK
        </p>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar - Projects List */}
        <div style={{ 
          width: 280, 
          borderRight: '1px solid var(--pr-border-soft)',
          background: 'var(--pr-depth-0)',
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '24px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderSync size={16} color="var(--pr-accent-primary)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--pr-text-tertiary)' }}>
              Your Projects
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
                  const isActive = p.id === activeProjectId;
                  return (
                    <button 
                      key={p.id}
                      onClick={() => setActiveProjectId(p.id)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        color: isActive ? 'var(--pr-text-primary)' : 'var(--pr-text-secondary)',
                        cursor: 'pointer',
                        fontSize: 14,
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

        {/* Right Side - Project Details */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {!activeProject ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pr-text-tertiary)' }}>
              Select or create a project to view settings
            </div>
          ) : (
            <div style={{ maxWidth: 600 }}>
              
              <h2 style={{ fontSize: 20, color: 'var(--pr-text-primary)', marginBottom: 24, fontWeight: 600 }}>
                {activeProject.name} Settings
              </h2>

              {/* API Key */}
              <div className="elevation-2" style={{ borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Key size={16} color="var(--pr-warning)" />
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
