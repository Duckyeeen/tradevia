// Cầu nối Frontend <-> Backend. Mọi module chỉ import từ file này, KHÔNG tự gọi fetch.
// Chỉ Project Lead sửa file này; cần thêm hàm thì báo Lead.
//
// Chế độ (VITE_API_MODE trong client/.env):
//   auto (mặc định): gọi backend thật; nếu backend không chạy => tự chuyển sang mock
//   live           : luôn gọi backend thật, lỗi thì ném ApiError
//   mock           : luôn dùng dữ liệu mock (làm UI khi chưa có backend)
import { ApiError } from './ApiError.js';
import { handleMock } from './mockAdapter.js';

export { ApiError };

const env = import.meta.env ?? {};
const CONFIGURED_MODE = ['live', 'mock', 'auto'].includes(String(env.VITE_API_MODE).toLowerCase())
  ? String(env.VITE_API_MODE).toLowerCase()
  : 'auto';
const BASE_URL = (env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''); // '' => đường dẫn tương đối qua Vite proxy
const TIMEOUT_MS = Number(env.VITE_API_TIMEOUT_MS) || 8000;

// ---------- trạng thái (để UI hiện banner "đang dùng dữ liệu mock") ----------
let status = { source: CONFIGURED_MODE === 'mock' ? 'mock' : 'live', reason: CONFIGURED_MODE === 'mock' ? 'configured' : null };
const listeners = new Set();

function setStatus(next) {
  status = next;
  listeners.forEach((fn) => fn(status));
}

/** { source: 'live' | 'mock', reason: null | 'configured' | 'backend-unreachable' } */
export const getApiStatus = () => status;

/** Đăng ký nhận thay đổi trạng thái; trả về hàm huỷ đăng ký (dùng trong useEffect). */
export function subscribeApiStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Thử lại backend thật (sau khi đã tự chuyển sang mock ở chế độ auto). */
export function retryLiveApi() {
  if (CONFIGURED_MODE !== 'mock') setStatus({ source: 'live', reason: null });
}

// ---------- lõi gọi HTTP ----------
function buildQuery(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') params.set(key, String(value).trim());
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

async function liveRequest(method, path, { query, body, signal } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onCallerAbort, { once: true });
  }

  let response;
  let text;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    text = await response.text();
  } catch (err) {
    if (timedOut) throw new ApiError({ status: 0, code: 'TIMEOUT', message: 'Request timed out' });
    if (err?.name === 'AbortError') throw new ApiError({ status: 0, code: 'ABORTED', message: 'Request was cancelled' });
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: err?.message || 'Network error' });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }

  let data = null;
  let parsed = true;
  if (text.trim() !== '') {
    try { data = JSON.parse(text); } catch { parsed = false; }
  }

  if (!response.ok) {
    const err = parsed ? data?.error : null;
    if (err && typeof err === 'object') {
      throw new ApiError({ status: response.status, code: err.code || `HTTP_${response.status}`, message: err.message || response.statusText, details: err.details });
    }
    if (typeof err === 'string') throw new ApiError({ status: response.status, code: `HTTP_${response.status}`, message: err });
    // Không có JSON lỗi chuẩn. 5xx rỗng/không phải JSON thường là Vite proxy báo backend chưa chạy
    // (=> BAD_RESPONSE, cho phép fallback mock). 4xx thì giữ nguyên mã HTTP, không fallback.
    const proxyFailure = response.status >= 500 && !(parsed && data !== null);
    throw new ApiError({ status: response.status, code: proxyFailure ? 'BAD_RESPONSE' : `HTTP_${response.status}`, message: response.statusText || 'Request failed' });
  }
  if (!parsed) {
    // 200 nhưng không phải JSON: thường là index.html do thiếu proxy /api
    throw new ApiError({ status: response.status, code: 'BAD_RESPONSE', message: 'Server did not return JSON. Check the Vite proxy for /api.' });
  }
  return data;
}

async function request(method, path, options = {}) {
  if (status.source === 'live') {
    try {
      return await liveRequest(method, path, options);
    } catch (err) {
      const canFallback = CONFIGURED_MODE === 'auto' && err instanceof ApiError && err.isNetworkError;
      if (!canFallback) throw err;
      console.warn(`[api] Backend không phản hồi (${err.code}). Chuyển sang dữ liệu mock.`);
      setStatus({ source: 'mock', reason: 'backend-unreachable' });
    }
  }
  const { signal: _signal, ...mockOptions } = options;
  return handleMock(method, path, mockOptions);
}

// ---------- 8 endpoint theo API contract ----------

/** GET /api/health */
export const getHealth = (options) => request('GET', '/api/health', options);

/** GET /api/suppliers — filters: 'electronics' hoặc { tag, search } */
export function getSuppliers(filters = {}, options = {}) {
  const query = typeof filters === 'string' ? { tag: filters } : filters;
  return request('GET', '/api/suppliers', { ...options, query });
}

/** GET /api/suppliers/:id */
export const getSupplierById = (id, options) =>
  request('GET', `/api/suppliers/${encodeURIComponent(id)}`, options);

/** GET /api/requests */
export const getRequests = (options) => request('GET', '/api/requests', options);

/** POST /api/requests — body theo "Buyer Request" trong data contract (cần buyerId) */
export const createRequest = (data, options = {}) => request('POST', '/api/requests', { ...options, body: data });

/** POST /api/matching → { requestId, results: [{ supplierId, score, breakdown, missingData }] } */
export function runMatching(requestId, options = {}) {
  if (typeof requestId !== 'string' || requestId.trim() === '') {
    return Promise.reject(new ApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'requestId is required', details: [{ field: 'requestId', message: 'requestId is required' }] }));
  }
  return request('POST', '/api/matching', { ...options, body: { requestId } });
}

/** GET /api/connections — query: { buyerId, supplierId } */
export const getConnections = (query = {}, options = {}) => request('GET', '/api/connections', { ...options, query });

/** POST /api/connections — body: { requestId, buyerId, supplierId } */
export const createConnection = (data, options = {}) => request('POST', '/api/connections', { ...options, body: data });

export default {
  getHealth, getSuppliers, getSupplierById, getRequests, createRequest,
  runMatching, getConnections, createConnection,
  getApiStatus, subscribeApiStatus, retryLiveApi,
};

