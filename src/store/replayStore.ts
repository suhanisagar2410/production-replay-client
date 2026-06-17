import { create } from 'zustand';

/* ============================================================
   TYPES — Execution Events & Replay Data
   ============================================================ */

export type EventType = 'function_call' | 'http_request' | 'http_response' | 'db_query_start' | 'db_query_end' | 'error' | 'manual_capture' | 'redis_command' | 'v8_crash_snapshot';

export interface ExecutionEvent {
  id: string;
  type: EventType;
  timestamp: number;
  requestId?: string;
  data: Record<string, unknown>;
}

export interface VariableState {
  name: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';
  children?: VariableState[];
}

export interface StackFrame {
  id: string;
  functionName: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  args: Record<string, unknown>;
}

export interface HttpCapture {
  id: string;
  requestId: string;
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  startTime: number;
  endTime?: number;
}

export interface DbQuery {
  id: string;
  queryId: string;
  sql: string;
  params?: unknown[];
  duration?: number;
  rowCount?: number;
  startTime: number;
  endTime?: number;
  dbType: 'postgresql' | 'mongodb' | 'redis';
}

export interface Replay {
  id: string;
  projectId: string;
  triggerType: string;
  triggerLabel?: string;
  errorMessage?: string;
  errorStack?: string;
  serviceName: string;
  environment: string;
  traceId?: string;
  durationMs: number;
  eventCount: number;
  capturedAt: string;
  severity?: 'critical' | 'error' | 'warning' | 'info';
  sdkVersion?: string;
  events?: ExecutionEvent[];
  httpCaptures?: HttpCapture[];
  dbQueries?: DbQuery[];
}

/* ============================================================
   REPLAY STORE — Timeline, cursor, selected event
   ============================================================ */

interface ReplayState {
  /* Current replay */
  currentReplay: Replay | null;
  replays: Replay[];
  isLoading: boolean;

  /* Timeline state */
  cursorPosition: number;  // index into events array
  isPlaying: boolean;
  zoomLevel: number;       // 1 = full view, higher = zoomed in
  zoomCenter: number;      // center of zoom window (ms timestamp)

  /* Selected items */
  selectedEvent: ExecutionEvent | null;
  selectedStackFrame: StackFrame | null;

  /* Distributed Tracing */
  traceReplays: Replay[];
  fetchTraceReplays: (id: string) => Promise<void>;

  /* Variable inspector */
  variables: VariableState[];
  callStack: StackFrame[];
  expandedVariables: Set<string>;

  /* Actions */
  setCurrentReplay: (replay: Replay | null) => void;
  setReplays: (replays: Replay[]) => void;
  setLoading: (loading: boolean) => void;
  setCursorPosition: (pos: number) => void;
  stepForward: (count?: number) => void;
  stepBackward: (count?: number) => void;
  jumpToError: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  togglePlaying: () => void;
  setZoomLevel: (level: number) => void;
  setZoomCenter: (center: number) => void;
  setSelectedEvent: (event: ExecutionEvent | null) => void;
  toggleVariableExpand: (path: string) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  fetchReplays: () => Promise<void>;
  fetchReplayById: (id: string) => Promise<void>;
  fetchPublicReplayById: (shareToken: string) => Promise<void>;
  clearAllReplays: () => Promise<void>;
}

export const useReplayStore = create<ReplayState>((set, get) => ({
  currentReplay: null,
  replays: [],
  isLoading: false,
  cursorPosition: 0,
  isPlaying: false,
  zoomLevel: 1,
  zoomCenter: 0,
  selectedEvent: null,
  selectedStackFrame: null,
  variables: [],
  callStack: [],
  expandedVariables: new Set(),
  traceReplays: [],
  activeProjectId: localStorage.getItem('activeProjectId') || null,
  setActiveProjectId: (id) => {
    if (id) {
      localStorage.setItem('activeProjectId', id);
    } else {
      localStorage.removeItem('activeProjectId');
    }
    set({ activeProjectId: id });
    get().fetchReplays();
  },

  setCurrentReplay: (replay) => set({ currentReplay: replay, cursorPosition: 0, isPlaying: false }),
  setReplays: (replays) => set({ replays }),
  setLoading: (isLoading) => set({ isLoading }),

  setCursorPosition: (pos) => {
    const { currentReplay } = get();
    if (!currentReplay || !currentReplay.events) return;
    const clamped = Math.max(0, Math.min(pos, currentReplay.events.length - 1));

    // Calculate variables and callStack up to position T
    const eventsUpToCursor = currentReplay.events.slice(0, clamped + 1);

    // Call stack: find most recent stack frames
    const callStack: any[] = [];
    eventsUpToCursor.forEach(e => {
      if (e.type === 'function_call') {
        callStack.push({
          id: e.id,
          functionName: String(e.data?.name || 'anonymous'),
          fileName: String(e.data?.file || 'unknown'),
          lineNumber: Number(e.data?.line || 0),
          columnNumber: 0,
          args: e.data?.args || {},
        });
      }
    });

    // Variables: most recent local variables
    const variablesMap = new Map<string, any>();
    eventsUpToCursor.forEach(e => {
      if (e.type === 'function_call' && e.data?.args) {
        Object.entries(e.data.args).forEach(([k, v]) => {
          variablesMap.set(k, {
            name: k,
            value: v,
            type: typeof v === 'object' ? 'object' : 'string',
          });
        });
      }
    });

    set({
      cursorPosition: clamped,
      selectedEvent: currentReplay.events[clamped] || null,
      callStack,
      variables: Array.from(variablesMap.values()),
    });
  },

  stepForward: (count = 1) => {
    const { cursorPosition } = get();
    get().setCursorPosition(cursorPosition + count);
  },

  stepBackward: (count = 1) => {
    const { cursorPosition } = get();
    get().setCursorPosition(cursorPosition - count);
  },

  jumpToError: () => {
    const { currentReplay } = get();
    if (!currentReplay || !currentReplay.events) return;
    const errorIdx = currentReplay.events.findIndex(e => e.type === 'error' || e.type === 'v8_crash_snapshot');
    if (errorIdx >= 0) get().setCursorPosition(errorIdx);
  },

  jumpToStart: () => get().setCursorPosition(0),
  jumpToEnd: () => {
    const { currentReplay } = get();
    if (currentReplay && currentReplay.events) get().setCursorPosition(currentReplay.events.length - 1);
  },

  togglePlaying: () => set(s => ({ isPlaying: !s.isPlaying })),
  setZoomLevel: (zoomLevel) => set({ zoomLevel: Math.max(1, Math.min(zoomLevel, 100)) }),
  setZoomCenter: (zoomCenter) => set({ zoomCenter }),
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),
  toggleVariableExpand: (path) => set(s => {
    const next = new Set(s.expandedVariables);
    if (next.has(path)) next.delete(path); else next.add(path);
    return { expandedVariables: next };
  }),
  fetchReplays: async () => {
    set({ isLoading: true });
    try {
      const { fetchReplays: apiFetchReplays } = await import('../api');
      const { activeProjectId } = get();
      const liveReplays = await apiFetchReplays(activeProjectId || undefined);
      set({ replays: liveReplays });
    } catch (err) {
      console.warn('Live server is unreachable or unauthorized, continuing with fallback.', err);
    } finally {
      set({ isLoading: false });
    }
  },
  fetchReplayById: async (id: string) => {
    set({ isLoading: true });
    try {
      const { fetchReplayById: apiFetchReplayById } = await import('../api');
      const fullReplay = await apiFetchReplayById(id);
      set({ currentReplay: fullReplay as any, cursorPosition: 0 });
    } catch (err) {
      console.error('Failed to load specific replay by ID', err);
    } finally {
      set({ isLoading: false });
    }
  },
  fetchPublicReplayById: async (shareToken: string) => {
    set({ isLoading: true });
    try {
      const { fetchPublicReplay } = await import('../api');
      const fullReplay = await fetchPublicReplay(shareToken);
      set({ currentReplay: fullReplay as any, cursorPosition: 0 });
    } catch (err) {
      console.error('Failed to load public shared replay', err);
    } finally {
      set({ isLoading: false });
    }
  },
  fetchTraceReplays: async (id: string) => {
    try {
      const { fetchTraceReplays: apiFetchTraceReplays } = await import('../api');
      const traces = await apiFetchTraceReplays(id);
      set({ traceReplays: traces as any[] });
    } catch (err) {
      console.error('Failed to load trace replays', err);
      set({ traceReplays: [] });
    }
  },
  clearAllReplays: async () => {
    try {
      const { deleteAllReplays } = await import('../api');
      await deleteAllReplays();
      set({ replays: [], currentReplay: null });
    } catch (err) {
      console.error('Failed to clear replays', err);
    }
  },
}));
