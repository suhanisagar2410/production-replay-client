import { useState } from 'react';
import { ChevronRight, Sparkles, Eye, Wrench, X } from 'lucide-react';
import { useReplayStore } from '../store/replayStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface VarNode {
  name: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';
  children?: VarNode[];
  scope?: 'local' | 'closure' | 'global';
  changed?: boolean; // true if value changed vs previous event
}

// ─── Type colors (zinc-safe) ──────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  string:    '#86EFAC',   // green-300
  number:    '#FCD34D',   // amber-300
  boolean:   '#C084FC',   // purple-400
  null:      '#52525B',   // zinc-600
  undefined: '#52525B',
  object:    '#A1A1AA',   // zinc-400
  array:     '#A1A1AA',
};

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label, count, open, onToggle }: {
  label: string; count: number; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        width: '100%', padding: '4px 8px',
        background: 'none', border: 'none', cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <ChevronRight
        size={9}
        style={{ color: 'var(--text3)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 150ms', flexShrink: 0 }}
      />
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text3)', textTransform: 'uppercase', flex: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{count}</span>
    </button>
  );
}

// ─── Single variable row ──────────────────────────────────────────────────────
function VarRow({ node, path, depth }: { node: VarNode; path: string; depth: number }) {
  const { expandedVariables, toggleVariableExpand } = useReplayStore();
  const isExpanded = expandedVariables.has(path);
  const hasChildren = node.children && node.children.length > 0;
  const isRedacted = typeof node.value === 'string' && node.value === '[REDACTED]';
  const isChanged = node.changed === true;

  const displayValue = () => {
    if (isRedacted) return '••••••';
    if (node.type === 'string') return `"${String(node.value)}"`;
    if (node.type === 'null') return 'null';
    if (node.type === 'undefined') return 'undefined';
    if (node.type === 'array') return `Array(${node.children?.length ?? 0})`;
    if (node.type === 'object') return hasChildren ? '{…}' : '{}';
    return String(node.value);
  };

  return (
    <>
      <div
        style={{
          display: 'flex', alignItems: 'baseline', gap: 5,
          padding: '1px 8px',
          paddingLeft: depth * 14 + 8,
          cursor: hasChildren ? 'pointer' : 'default',
          fontSize: 11.5,
          lineHeight: 1.75,
          fontFamily: 'var(--font-mono)',
          transition: 'background 60ms',
          // Changed-value highlight
          background: isChanged ? '#422006' : 'transparent',
          borderLeft: isChanged ? '2px solid #D97706' : '2px solid transparent',
          position: 'relative',
        }}
        onClick={() => hasChildren && toggleVariableExpand(path)}
        onMouseEnter={e => {
          if (!isChanged) e.currentTarget.style.background = 'var(--bg3)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = isChanged ? '#422006' : 'transparent';
        }}
      >
        {/* Expand chevron */}
        {hasChildren ? (
          <ChevronRight
            size={9}
            style={{
              color: 'var(--text3)', flexShrink: 0,
              transform: isExpanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 150ms',
            }}
          />
        ) : (
          <span style={{ width: 9, display: 'inline-block', flexShrink: 0 }} />
        )}

        {/* Key name */}
        <span style={{ color: 'var(--text2)' }}>{node.name}</span>
        <span style={{ color: 'var(--text3)' }}>:</span>

        {/* Value */}
        <span style={{
          color: isRedacted ? '#52525B' : TYPE_COLOR[node.type] || 'var(--text)',
          fontStyle: (isRedacted || node.type === 'null' || node.type === 'undefined') ? 'italic' : 'normal',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {displayValue()}
        </span>

        {/* Changed badge */}
        {isChanged && (
          <span style={{
            fontSize: 9, fontFamily: 'var(--font-mono)',
            background: '#D9770622', color: '#D97706',
            border: '1px solid #D97706',
            borderRadius: 3, padding: '0 4px',
            flexShrink: 0, lineHeight: '14px',
          }}>
            changed
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div style={{ borderLeft: '1px solid var(--border)', marginLeft: depth * 14 + 13 }}>
          {node.children!.map((child, i) => (
            <VarRow key={i} node={child} path={`${path}.${child.name}`} depth={depth + 1} />
          ))}
        </div>
      )}
    </>
  );
}

// ─── AI Root Cause card ───────────────────────────────────────────────────────
function AIRootCauseCard({ errorMessage }: { errorMessage?: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed || !errorMessage) return null;

  // Synthetic confidence based on whether we have an error message
  const confidence = 87;

  return (
    <div style={{
      margin: '8px 8px',
      background: '#1A103B',
      border: '1px solid #4C1D95',
      borderRadius: 7,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 10px',
        borderBottom: expanded ? '1px solid #2D1B69' : 'none',
        cursor: 'pointer',
      }} onClick={() => setExpanded(!expanded)}>
        <Sparkles size={12} style={{ color: '#A78BFA', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#C4B5FD', flex: 1 }}>
          AI Root Cause
        </span>
        {/* Confidence pill */}
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)',
          background: '#4C1D9533', color: '#A78BFA',
          border: '1px solid #4C1D95',
          borderRadius: 10, padding: '1px 7px',
        }}>
          {confidence}% confidence
        </span>
        <button
          onClick={e => { e.stopPropagation(); setDismissed(true); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#6D28D9', lineHeight: 1 }}
          title="Dismiss"
        >
          <X size={11} />
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: '8px 10px' }}>
          <p style={{ fontSize: 11, color: '#A78BFA', lineHeight: 1.6, margin: '0 0 10px' }}>
            This error is likely caused by an <strong style={{ color: '#C4B5FD' }}>unhandled null reference</strong> in the request handler.
            The variable <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: '#2D1B69', borderRadius: 3, padding: '1px 4px' }}>req.user</code> is accessed
            before authentication middleware sets it, causing a runtime crash.
          </p>
          {/* Error source */}
          <div style={{
            background: '#0D0B1A', border: '1px solid #2D1B69',
            borderRadius: 5, padding: '6px 10px', marginBottom: 10,
            fontFamily: 'var(--font-mono)', fontSize: 10, color: '#7C3AED',
          }}>
            <span style={{ color: '#52525B' }}>at </span>
            <span style={{ color: '#A78BFA' }}>{errorMessage?.slice(0, 60) || 'handler.ts:42'}</span>
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '5px 0', background: '#2D1B69', border: '1px solid #4C1D95',
              borderRadius: 5, cursor: 'pointer', fontSize: 11, color: '#C4B5FD',
              fontFamily: 'var(--font-mono)',
            }}>
              <Eye size={11} /> View evidence
            </button>
            <button style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '5px 0', background: '#3B0764', border: '1px solid #6D28D9',
              borderRadius: 5, cursor: 'pointer', fontSize: 11, color: '#E9D5FF',
              fontFamily: 'var(--font-mono)',
            }}>
              <Wrench size={11} /> See fix
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main VariableTree ────────────────────────────────────────────────────────
export default function VariableTree() {
  const { variables: liveVars, currentReplay, cursorPosition } = useReplayStore();
  const variables = (liveVars || []) as VarNode[];

  // Section open/closed state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    local: true, closure: false, global: false,
  });
  const toggle = (s: string) => setOpenSections(p => ({ ...p, [s]: !p[s] }));

  // Group variables by scope
  const local   = variables.filter(v => !v.scope || v.scope === 'local');
  const closure = variables.filter(v => v.scope === 'closure');
  const global  = variables.filter(v => v.scope === 'global');

  // If nothing has a scope property, show all under LOCAL
  const hasScopes = variables.some(v => v.scope);
  const displayLocal   = hasScopes ? local   : variables;
  const displayClosure = hasScopes ? closure : [];
  const displayGlobal  = hasScopes ? global  : [];

  // Error for AI card
  const errorMsg = currentReplay?.errorMessage;
  const currentEvent = currentReplay?.events?.[cursorPosition];
  const isOnErrorEvent = currentEvent?.type === 'error' || currentEvent?.type === 'v8_crash_snapshot';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>
      {/* ── Panel header ─────────────────── */}
      <div style={{
        padding: '7px 10px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Variables
        </span>
        <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          {variables.length} in scope
        </span>
      </div>

      {/* ── Variable sections (scrollable) ─ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {variables.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, fontSize: 11, color: 'var(--text3)', textAlign: 'center',
          }}>
            Step through the timeline<br />to inspect variables
          </div>
        ) : (
          <>
            {/* LOCAL */}
            <SectionHeader
              label="local"
              count={displayLocal.length}
              open={openSections.local}
              onToggle={() => toggle('local')}
            />
            {openSections.local && displayLocal.map((v, i) => (
              <VarRow key={i} node={v} path={v.name} depth={0} />
            ))}

            {/* CLOSURE */}
            {displayClosure.length > 0 && (
              <>
                <SectionHeader
                  label="closure"
                  count={displayClosure.length}
                  open={openSections.closure}
                  onToggle={() => toggle('closure')}
                />
                {openSections.closure && displayClosure.map((v, i) => (
                  <VarRow key={i} node={v} path={`closure.${v.name}`} depth={0} />
                ))}
              </>
            )}

            {/* GLOBAL */}
            {displayGlobal.length > 0 && (
              <>
                <SectionHeader
                  label="global"
                  count={displayGlobal.length}
                  open={openSections.global}
                  onToggle={() => toggle('global')}
                />
                {openSections.global && displayGlobal.map((v, i) => (
                  <VarRow key={i} node={v} path={`global.${v.name}`} depth={0} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* ── AI Root Cause card ─────────────── */}
      {(isOnErrorEvent || errorMsg) && (
        <AIRootCauseCard errorMessage={errorMsg ?? undefined} />
      )}
    </div>
  );
}
