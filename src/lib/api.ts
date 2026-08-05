const DEFAULT_API_URL = 'https://vupi.us/delivery/v1';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
export const DELIVERY_API_KEY = String(import.meta.env.VITE_DELIVERY_API_KEY || '').trim();
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/v1$/, '')).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

const responseBody = async (response: Response): Promise<any> => {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  return text === '' ? null : text;
};

let refreshPromise: Promise<boolean> | null = null;

export const refreshSession = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const headers = new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
    if (DELIVERY_API_KEY) headers.set('X-API-Key', DELIVERY_API_KEY);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          refresh_token: refreshToken,
          papel: (() => {
            try { return JSON.parse(localStorage.getItem('user') || '{}').tipo_usuario || null; }
            catch { return null; }
          })(),
        }),
      });
      const data = await responseBody(response);
      if (!response.ok || !data?.access_token || !data?.refresh_token) {
        throw new ApiError('Não foi possível renovar a sessão.', response.status, data);
      }
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      if (data.usuario) localStorage.setItem('user', JSON.stringify(data.usuario));
      return true;
    } catch {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('delivery:session-expired'));
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const tokenExpiresAt = (token: string): number => {
  try {
    const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = raw.padEnd(Math.ceil(raw.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded));
    return Number(payload.exp || 0);
  } catch {
    return 0;
  }
};

export const ensureFreshSession = async (minimumValiditySeconds = 120): Promise<boolean> => {
  const token = localStorage.getItem('authToken');
  if (
    token
    && tokenExpiresAt(token) > Math.floor(Date.now() / 1000) + minimumValiditySeconds
  ) {
    return true;
  }
  return refreshSession();
};

const requiresAuthentication = (path: string, method: string): boolean => {
  const protectedPrefixes = [
    '/admin/',
    '/notificacoes',
    '/equipe',
    '/entregador',
    '/perfis',
    '/enderecos',
    '/chat',
    '/realtime',
  ];

  if (protectedPrefixes.some((prefix) => path === prefix || path.startsWith(prefix))) {
    return true;
  }
  if (path === '/auth/profile' || path === '/auth/change-password') return true;
  if (path === '/configuracao' && method !== 'GET') return true;
  if (path === '/pedidos' || path.startsWith('/pedidos/')) {
    return !path.startsWith('/pedidos/validar/');
  }

  return false;
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const method = String(options.method || 'GET').toUpperCase();
  const protectedRequest = requiresAuthentication(path, method);

  if (protectedRequest) {
    const authenticated = await ensureFreshSession();
    if (!authenticated) {
      throw new ApiError('Sua sessão expirou. Entre novamente.', 401);
    }
  }

  const token = localStorage.getItem('authToken');
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');
  if (DELIVERY_API_KEY) headers.set('X-API-Key', DELIVERY_API_KEY);
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new ApiError('Não foi possível conectar ao serviço de delivery.', 0, error);
  }

  let data = await responseBody(response);
  const isRefreshRequest = path === '/auth/refresh';
  if (response.status === 401 && !isRefreshRequest && localStorage.getItem('refreshToken')) {
    const renewed = await refreshSession();
    if (renewed) {
      const renewedToken = localStorage.getItem('authToken');
      if (renewedToken) headers.set('Authorization', `Bearer ${renewedToken}`);
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
      data = await responseBody(response);
    }
  }
  if (!response.ok) {
    const message = data && typeof data === 'object'
      ? data.error || data.message
      : typeof data === 'string' ? data : null;
    throw new ApiError(message || 'Erro ao processar a solicitação.', response.status, data);
  }
  return data;
};

export const produtosAPI = {
  getAll: () => apiRequest('/produtos'),
  getAllAdmin: () => apiRequest('/admin/produtos'),
  getById: (id: string) => apiRequest(`/produtos/${id}`),
  create: (data: unknown) => apiRequest('/admin/produtos', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) => apiRequest(`/admin/produtos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/admin/produtos/${id}`, { method: 'DELETE' }),
};

export const categoriasAPI = {
  getAll: (publicas = true) => apiRequest(publicas ? '/categorias' : '/admin/categorias'),
  getById: async (id: string) => {
    const categorias = await apiRequest('/admin/categorias');
    return categorias.find((categoria: any) => (categoria.uuid ?? categoria.id) === id) ?? null;
  },
  create: (data: unknown) => apiRequest('/admin/categorias', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: unknown) => apiRequest(`/admin/categorias/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/admin/categorias/${id}`, { method: 'DELETE' }),
};

export const pedidosAPI = {
  getAll: () => apiRequest('/pedidos'),
  getById: (id: string) => apiRequest(`/pedidos/${id}`),
  create: (data: unknown, authenticated = true) => apiRequest(authenticated ? '/pedidos' : '/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStatus: (id: string, status: string) => apiRequest(`/pedidos/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  validate: (token: string) => apiRequest(`/pedidos/validar/${encodeURIComponent(token)}`),
};

export const perfisAPI = {
  create: (data: unknown) => apiRequest('/equipe', { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => apiRequest('/perfis'),
  getById: (id: string) => apiRequest(`/perfis/${id}`),
  update: (id: string, data: unknown) => apiRequest(`/perfis/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updatePassword: (id: string, newPassword: string) => apiRequest(`/perfis/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword, nova_senha: newPassword }),
  }),
  delete: (id: string) => apiRequest(`/perfis/${id}`, { method: 'DELETE' }),
};

export const authAPI = {
  signup: (data: unknown) => apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  signin: (data: unknown) => apiRequest('/auth/signin', { method: 'POST', body: JSON.stringify(data) }),
  google: (credential: string, papel: 'cliente' | 'entregador' | 'equipe') => apiRequest('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential, papel }),
  }),
  refresh: refreshSession,
  getProfile: () => apiRequest('/auth/profile'),
};

export const enderecosAPI = {
  getEnderecos: () => apiRequest('/enderecos'),
  addEndereco: (data: unknown) => apiRequest('/enderecos', { method: 'POST', body: JSON.stringify(data) }),
  updateEndereco: (id: string, data: unknown) => apiRequest(`/enderecos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEndereco: (id: string) => apiRequest(`/enderecos/${id}`, { method: 'DELETE' }),
};
