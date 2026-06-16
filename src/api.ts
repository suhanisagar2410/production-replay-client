// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

import { useAuthStore } from './store/authStore';

function getHeaders() {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export interface ReplayMetadata {
  id: string;
  projectId: string;
  triggerType: string;
  triggerLabel?: string;
  errorMessage?: string;
  errorStack?: string;
  serviceName: string;
  environment: string;
  durationMs: number;
  eventCount: number;
  capturedAt: string;
}

export interface HttpCapture {
  method: string;
  url: string;
  status: number;
  durationMs: number;
  requestHeaders?: any;
  responseHeaders?: any;
  requestBody?: any;
  responseBody?: any;
}

export interface DbQuery {
  query: string;
  durationMs: number;
  driver: string;
  collectionOrTable?: string;
}

export interface ReplayPayload extends ReplayMetadata {
  events: any[];
  httpCaptures: HttpCapture[];
  dbQueries: DbQuery[];
}

export async function fetchReplays(): Promise<ReplayMetadata[]> {
  const res = await fetch(`${API_BASE_URL}/replays`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch replays');
  return res.json();
}

export async function fetchReplayById(id: string): Promise<ReplayPayload> {
  const res = await fetch(`${API_BASE_URL}/replays/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch replay details');
  return res.json();
}

export async function fetchTraceReplays(id: string): Promise<ReplayMetadata[]> {
  const res = await fetch(`${API_BASE_URL}/replays/${id}/trace`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch trace replays');
  return res.json();
}

export async function deleteAllReplays(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/replays`, { 
    method: 'DELETE',
    headers: getHeaders() 
  });
  if (!res.ok) throw new Error('Failed to delete replays');
  return res.json();
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function fetchMe() {
  const res = await fetch(`${BACKEND_URL}/auth/me`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(name: string) {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export interface DashboardStats {
  totalReplays: number;
  prevTotalReplays: number;
  errorRate: number;
  prevErrorRate: number;
  p95ResponseTime: number;
  prevP95ResponseTime: number;
  avgResolveTime: number;
  replaysByDay: { label: string; total: number; errors: number }[];
  triggerBreakdown: { type: string; count: number }[];
  topEndpoints: { endpoint: string; count: number }[];
  responseTimeBuckets: { label: string; count: number }[];
  dbQueryPerf: { table: string; avgMs: number }[];
}

export async function fetchStats(range: '24h' | '7d' | '30d'): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE_URL}/stats?range=${range}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

