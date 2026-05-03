import { ChevronRight } from 'lucide-react';
import { useReplayStore } from '../store/replayStore';
import { mockVariables } from '../data/mockData';

interface VarNode {
  name: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';
  children?: VarNode[];
}

const TYPE_COLORS: Record<string, string> = {
  string: '#86EFAC',
  number: 'var(--pr-event-database)',
  boolean: '#C4B5FD',
  null: 'var(--pr-text-tertiary)',
  undefined: 'var(--pr-text-tertiary)',
  object: 'var(--pr-text-secondary)',
  array: 'var(--pr-text-secondary)',
};

function VarRow({ node, path, depth }: { node: VarNode; path: string; depth: number }) {
  const { expandedVariables, toggleVariableExpand } = useReplayStore();
  const isExpanded = expandedVariables.has(path);
  const hasChildren = node.children && node.children.length > 0;
  const isRedacted = typeof node.value === 'string' && node.value === '[REDACTED]';

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          padding: '1px 8px',
          paddingLeft: depth * 16 + 8,
          borderRadius: 'var(--radius-sm)',
          cursor: hasChildren ? 'pointer' : 'default',
          fontSize: 12,
          lineHeight: 1.7,
          fontFamily: 'var(--font-code)',
          transition: 'background 80ms',
        }}
        onClick={() => hasChildren && toggleVariableExpand(path)}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--pr-depth-3)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Expand chevron */}
        {hasChildren ? (
          <ChevronRight
            size={10}
            style={{
              color: 'var(--pr-text-tertiary)',
              transition: 'transform 150ms',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              flexShrink: 0,
            }}
          />
        ) : (
          <span style={{ width: 10, flexShrink: 0 }} />
        )}

        {/* Key */}
        <span style={{ color: 'var(--pr-text-secondary)' }}>{node.name}</span>
        <span style={{ color: 'var(--pr-text-tertiary)' }}>:</span>

        {/* Value */}
        <span style={{
          color: isRedacted ? 'var(--pr-text-disabled)' : TYPE_COLORS[node.type] || 'var(--pr-text-primary)',
          fontStyle: isRedacted || node.type === 'null' ? 'italic' : 'normal',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {node.type === 'string' && !isRedacted ? `"${node.value}"` :
           node.type === 'null' ? 'null' :
           node.type === 'undefined' ? 'undefined' :
           String(node.value)}
        </span>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div style={{ borderLeft: '1px solid var(--pr-border-subtle)', marginLeft: depth * 16 + 13 }}>
          {node.children!.map((child, i) => (
            <VarRow key={i} node={child} path={`${path}.${child.name}`} depth={depth + 1} />
          ))}
        </div>
      )}
    </>
  );
}

export default function VariableTree() {
  const variables = mockVariables as VarNode[];

  return (
    <div style={{ overflow: 'auto', flex: 1 }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '0.5px solid var(--pr-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--type-display-md)',
          fontWeight: 600,
          color: 'var(--pr-text-primary)',
          fontSize: 13,
        }}>
          Variables
        </span>
        <span style={{ fontSize: 11, color: 'var(--pr-text-tertiary)', fontFamily: 'var(--font-code)' }}>
          {variables.length} in scope
        </span>
      </div>
      <div style={{ padding: '4px 0' }}>
        {variables.map((v, i) => (
          <VarRow key={i} node={v} path={v.name} depth={0} />
        ))}
      </div>
    </div>
  );
}
