import type { Replay, ExecutionEvent, HttpCapture, DbQuery } from '../store/replayStore';

/* ============================================================
   MOCK DATA — Realistic replay data for UI development
   ============================================================ */

const now = Date.now();
const BASE_TIME = now - 120000; // 2 minutes ago

function ts(offset: number): number { return BASE_TIME + offset; }
function id(): string { return Math.random().toString(36).slice(2, 10); }

const mockEvents: ExecutionEvent[] = [
  { id: id(), type: 'function_call', timestamp: ts(0), data: { name: 'handleRequest', file: 'routes/users.ts', line: 42, args: { method: 'GET', path: '/api/users/123' } } },
  { id: id(), type: 'http_request', timestamp: ts(5), requestId: 'req-001', data: { method: 'GET', url: '/api/users/123', headers: { 'content-type': 'application/json' } } },
  { id: id(), type: 'function_call', timestamp: ts(12), data: { name: 'authenticateToken', file: 'middleware/auth.ts', line: 15, args: { token: '[REDACTED]' } } },
  { id: id(), type: 'function_call', timestamp: ts(18), data: { name: 'validateUserId', file: 'validators/user.ts', line: 8, args: { userId: '123' } } },
  { id: id(), type: 'db_query_start', timestamp: ts(25), data: { sql: 'SELECT * FROM users WHERE id = $1', params: ['123'], db: 'postgresql' } },
  { id: id(), type: 'db_query_end', timestamp: ts(52), data: { duration: 27, rowCount: 1, sql: 'SELECT * FROM users WHERE id = $1' } },
  { id: id(), type: 'function_call', timestamp: ts(55), data: { name: 'transformUser', file: 'services/userService.ts', line: 67, args: { user: { id: '123', name: 'Suhani', email: 'suhani@example.com' } } } },
  { id: id(), type: 'db_query_start', timestamp: ts(60), data: { sql: 'SELECT * FROM user_preferences WHERE user_id = $1', params: ['123'], db: 'postgresql' } },
  { id: id(), type: 'db_query_end', timestamp: ts(85), data: { duration: 25, rowCount: 1, sql: 'SELECT * FROM user_preferences WHERE user_id = $1' } },
  { id: id(), type: 'function_call', timestamp: ts(90), data: { name: 'fetchUserOrders', file: 'services/orderService.ts', line: 23, args: { userId: '123', limit: 10 } } },
  { id: id(), type: 'http_request', timestamp: ts(95), requestId: 'req-002', data: { method: 'GET', url: 'https://orders-api.internal/v2/orders?userId=123&limit=10' } },
  { id: id(), type: 'http_response', timestamp: ts(230), requestId: 'req-002', data: { statusCode: 200, duration: 135, body: { orders: [{ id: 'ord-1', total: 2499 }] } } },
  { id: id(), type: 'function_call', timestamp: ts(235), data: { name: 'mergeUserData', file: 'services/userService.ts', line: 89, args: { userId: '123' } } },
  { id: id(), type: 'function_call', timestamp: ts(240), data: { name: 'calculateLoyaltyTier', file: 'utils/loyalty.ts', line: 12, args: { totalOrders: 47, totalSpent: 124500 } } },
  { id: id(), type: 'db_query_start', timestamp: ts(245), data: { sql: 'UPDATE users SET last_active = NOW() WHERE id = $1', params: ['123'], db: 'postgresql' } },
  { id: id(), type: 'db_query_end', timestamp: ts(260), data: { duration: 15, rowCount: 1, sql: 'UPDATE users SET last_active = NOW() WHERE id = $1' } },
  { id: id(), type: 'function_call', timestamp: ts(265), data: { name: 'serializeResponse', file: 'utils/serializer.ts', line: 34 } },
  { id: id(), type: 'function_call', timestamp: ts(270), data: { name: 'processPayment', file: 'services/payment.ts', line: 56, args: { userId: '123', amount: 4999, currency: 'INR' } } },
  { id: id(), type: 'http_request', timestamp: ts(275), requestId: 'req-003', data: { method: 'POST', url: 'https://api.stripe.com/v1/charges', body: { amount: 4999, currency: 'inr' } } },
  { id: id(), type: 'http_response', timestamp: ts(580), requestId: 'req-003', data: { statusCode: 500, duration: 305, body: { error: { type: 'card_error', message: 'Your card was declined.' } } } },
  { id: id(), type: 'error', timestamp: ts(585), data: { name: 'PaymentError', message: 'Stripe charge failed: Your card was declined.', stack: 'PaymentError: Stripe charge failed\n    at processPayment (services/payment.ts:72)\n    at handleCheckout (routes/checkout.ts:45)\n    at Layer.handle (express/lib/router/layer.js:95)' } },
  { id: id(), type: 'http_response', timestamp: ts(590), requestId: 'req-001', data: { statusCode: 500, duration: 590, body: { error: 'Internal server error' } } },
];

const mockHttpCaptures: HttpCapture[] = [
  { id: id(), requestId: 'req-001', method: 'GET', url: '/api/users/123', statusCode: 500, duration: 590, startTime: ts(5), endTime: ts(590), requestHeaders: { 'authorization': '[REDACTED]', 'content-type': 'application/json' }, responseBody: { error: 'Internal server error' } },
  { id: id(), requestId: 'req-002', method: 'GET', url: 'https://orders-api.internal/v2/orders?userId=123&limit=10', statusCode: 200, duration: 135, startTime: ts(95), endTime: ts(230), responseBody: { orders: [{ id: 'ord-1', total: 2499 }] } },
  { id: id(), requestId: 'req-003', method: 'POST', url: 'https://api.stripe.com/v1/charges', statusCode: 500, duration: 305, startTime: ts(275), endTime: ts(580), requestBody: { amount: 4999, currency: 'inr' }, responseBody: { error: { type: 'card_error', message: 'Your card was declined.' } } },
];

const mockDbQueries: DbQuery[] = [
  { id: id(), queryId: 'q-001', sql: 'SELECT * FROM users WHERE id = $1', params: ['123'], duration: 27, rowCount: 1, startTime: ts(25), endTime: ts(52), dbType: 'postgresql' },
  { id: id(), queryId: 'q-002', sql: 'SELECT * FROM user_preferences WHERE user_id = $1', params: ['123'], duration: 25, rowCount: 1, startTime: ts(60), endTime: ts(85), dbType: 'postgresql' },
  { id: id(), queryId: 'q-003', sql: 'UPDATE users SET last_active = NOW() WHERE id = $1', params: ['123'], duration: 15, rowCount: 1, startTime: ts(245), endTime: ts(260), dbType: 'postgresql' },
];

export const mockReplays: Replay[] = [
  {
    id: 'rpl-001',
    projectId: 'proj-001',
    triggerType: 'uncaught_exception',
    triggerLabel: 'payment-failed',
    errorMessage: 'Stripe charge failed: Your card was declined.',
    errorStack: 'PaymentError: Stripe charge failed\n    at processPayment (services/payment.ts:72)\n    at handleCheckout (routes/checkout.ts:45)',
    serviceName: 'payment-service',
    environment: 'production',
    durationMs: 590,
    eventCount: mockEvents.length,
    capturedAt: new Date(now - 300000).toISOString(),
    events: mockEvents,
    httpCaptures: mockHttpCaptures,
    dbQueries: mockDbQueries,
  },
  {
    id: 'rpl-002',
    projectId: 'proj-001',
    triggerType: 'http_error',
    errorMessage: 'ECONNREFUSED: Connection refused to database',
    serviceName: 'user-service',
    environment: 'production',
    durationMs: 1250,
    eventCount: 34,
    capturedAt: new Date(now - 900000).toISOString(),
    events: [],
    httpCaptures: [],
    dbQueries: [],
  },
  {
    id: 'rpl-003',
    projectId: 'proj-001',
    triggerType: 'manual',
    triggerLabel: 'slow-query-detected',
    serviceName: 'analytics-service',
    environment: 'staging',
    durationMs: 4500,
    eventCount: 128,
    capturedAt: new Date(now - 3600000).toISOString(),
    events: [],
    httpCaptures: [],
    dbQueries: [],
  },
  {
    id: 'rpl-004',
    projectId: 'proj-001',
    triggerType: 'unhandled_rejection',
    errorMessage: 'TypeError: Cannot read property \'email\' of undefined',
    errorStack: 'TypeError: Cannot read property \'email\' of undefined\n    at sendWelcomeEmail (services/email.ts:23)\n    at createUser (routes/auth.ts:67)',
    serviceName: 'auth-service',
    environment: 'production',
    durationMs: 320,
    eventCount: 18,
    capturedAt: new Date(now - 7200000).toISOString(),
    events: [],
    httpCaptures: [],
    dbQueries: [],
  },
  {
    id: 'rpl-005',
    projectId: 'proj-001',
    triggerType: 'uncaught_exception',
    errorMessage: 'RangeError: Maximum call stack size exceeded',
    serviceName: 'notification-service',
    environment: 'production',
    durationMs: 89,
    eventCount: 256,
    capturedAt: new Date(now - 14400000).toISOString(),
    events: [],
    httpCaptures: [],
    dbQueries: [],
  },
];

export const mockVariables = [
  { name: 'userId', value: '123', type: 'string' as const },
  { name: 'amount', value: 4999, type: 'number' as const },
  { name: 'isAuthenticated', value: true, type: 'boolean' as const },
  { name: 'user', value: '{ id, name, email }', type: 'object' as const, children: [
    { name: 'id', value: '123', type: 'string' as const },
    { name: 'name', value: 'Suhani', type: 'string' as const },
    { name: 'email', value: 'suhani@example.com', type: 'string' as const },
  ]},
  { name: 'orders', value: '[1 item]', type: 'array' as const, children: [
    { name: '0', value: '{ id, total }', type: 'object' as const, children: [
      { name: 'id', value: 'ord-1', type: 'string' as const },
      { name: 'total', value: 2499, type: 'number' as const },
    ]},
  ]},
  { name: 'paymentResult', value: null, type: 'null' as const },
  { name: 'stripeToken', value: '[REDACTED]', type: 'string' as const },
  { name: 'retryCount', value: 0, type: 'number' as const },
];

export const mockCallStack: { id: string; functionName: string; fileName: string; lineNumber: number; columnNumber: number; args: Record<string, unknown> }[] = [
  { id: 's1', functionName: 'processPayment', fileName: 'services/payment.ts', lineNumber: 72, columnNumber: 15, args: { userId: '123', amount: 4999 } },
  { id: 's2', functionName: 'handleCheckout', fileName: 'routes/checkout.ts', lineNumber: 45, columnNumber: 12, args: { req: '{...}', res: '{...}' } },
  { id: 's3', functionName: 'Layer.handle', fileName: 'express/lib/router/layer.js', lineNumber: 95, columnNumber: 5, args: {} },
  { id: 's4', functionName: 'next', fileName: 'express/lib/router/route.js', lineNumber: 144, columnNumber: 13, args: {} },
  { id: 's5', functionName: 'Route.dispatch', fileName: 'express/lib/router/route.js', lineNumber: 114, columnNumber: 3, args: {} },
];
