import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Folder, Zap, CornerDownLeft, Clock } from 'lucide-react';
import { useReplayStore } from '../store/replayStore';
import { fetchProjects } from '../api';

interface SearchResult {
  type: 'replay' | 'project';
  id: string;
  label: string;
  sublabel: string;
  path: string;
}

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const replays = useReplayStore(state => state.replays);
  const [projects, setProjects] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  useEffect(() => {
    const stored = localStorage.getItem('pr_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  // Fetch projects on open
  useEffect(() => {
    if (isOpen) {
      fetchProjects().then(setProjects).catch(() => {});
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const addRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const next = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(next);
    localStorage.setItem('pr_recent_searches', JSON.stringify(next));
  };

  // Compute search results
  const results = useMemo<SearchResult[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const projectResults: SearchResult[] = projects
      .filter(p => p.name.toLowerCase().includes(trimmed))
      .map(p => ({
        type: 'project',
        id: p.id,
        label: p.name,
        sublabel: 'Project Settings',
        path: `/settings`,
      }));

    const replayResults: SearchResult[] = replays
      .filter(r => 
        r.errorMessage?.toLowerCase().includes(trimmed) ||
        r.serviceName.toLowerCase().includes(trimmed) ||
        r.triggerType.toLowerCase().includes(trimmed) ||
        r.environment.toLowerCase().includes(trimmed) ||
        r.id.toLowerCase().includes(trimmed)
      )
      .map(r => ({
        type: 'replay',
        id: r.id,
        label: r.errorMessage || `${r.triggerType.replace(/_/g, ' ')} in ${r.serviceName}`,
        sublabel: `${r.serviceName} (${r.environment}) · ${r.durationMs}ms`,
        path: `/replays/${r.id}`,
      }));

    return [...projectResults, ...replayResults].slice(0, 10);
  }, [query, projects, replays]);

  // Handle keydown navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          const res = results[selectedIndex];
          addRecentSearch(query);
          navigate(res.path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, query, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 550,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <SearchIcon size={16} style={{ color: 'var(--text3)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search replays, projects..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: 14,
            }}
          />
        </div>

        {/* Results List */}
        <div style={{ padding: 6, maxHeight: 300, overflowY: 'auto' }}>
          {query.trim() === '' ? (
            recentSearches.length > 0 ? (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 10px 4px 10px' }}>
                  Recent Searches
                </div>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => { setQuery(term); inputRef.current?.focus(); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text2)',
                      cursor: 'pointer',
                      fontSize: 13,
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Clock size={13} style={{ color: 'var(--text3)' }} />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                No recent searches. Start typing to search.
              </div>
            )
          ) : results.length > 0 ? (
            results.map((res, idx) => {
              const active = idx === selectedIndex;
              return (
                <button
                  key={`${res.type}-${res.id}`}
                  onClick={() => { addRecentSearch(query); navigate(res.path); onClose(); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: active ? 'var(--bg3)' : 'transparent',
                    border: 'none',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {res.type === 'project' ? (
                      <Folder size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                    ) : (
                      <Zap size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                        {res.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {res.sublabel}
                      </div>
                    </div>
                  </div>
                  {active && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text3)', fontSize: 10 }}>
                      <span>Jump</span>
                      <CornerDownLeft size={10} />
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No results found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}>
          <div>
            Search powered by <span style={{ fontWeight: 600, color: 'var(--text2)' }}>Production Replay</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span><kbd style={{ background: 'var(--bg2)', padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border)' }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ background: 'var(--bg2)', padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border)' }}>↵</kbd> Select</span>
            <span><kbd style={{ background: 'var(--bg2)', padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border)' }}>esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
