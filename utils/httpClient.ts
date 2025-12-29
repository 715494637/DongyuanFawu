/**
 * 统一的 HTTP 客户端
 *
 * 使用方法：
 * 1. 公开接口：使用 http.get(), http.post() 等
 * 2. 需认证接口：使用 http.auth.get(), http.auth.post() 等
 * 3. 自动处理 token 过期，统一处理 401/403 错误
 */

const API_BASE = 'http://localhost:8000/api/v1';

/**
 * 获取存储的 token
 */
const getToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * 解析 JWT token 获取过期时间
 */
const getTokenExpiration = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // 转换为毫秒
  } catch {
    return null;
  }
};

/**
 * 检查 token 是否即将过期（5分钟内）
 */
const isTokenExpiringSoon = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return false;
  return expiration - Date.now() < 5 * 60 * 1000;
};

/**
 * 清除 token 并跳转到登录页
 */
const handleAuthError = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  window.location.href = '/login';
};

/**
 * 基础请求函数（公开接口）
 */
const request = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  return fetch(url, options);
};

/**
 * 认证请求函数（自动添加 token）
 */
const authRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();

  if (!token) {
    handleAuthError();
    throw new Error('未登录，请先登录');
  }

  // 检查 token 是否即将过期
  if (isTokenExpiringSoon(token)) {
    console.warn('Token 即将过期，建议重新登录');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });

  // 处理认证错误
  if (response.status === 401) {
    handleAuthError();
    throw new Error('认证失败，请重新登录');
  }

  if (response.status === 403) {
    throw new Error('权限不足');
  }

  return response;
};

/**
 * HTTP 方法封装（公开接口）
 */
export const http = {
  get: (endpoint: string) => request(endpoint),
  post: (endpoint: string, data?: any) =>
    request(endpoint, {
      method: 'POST',
      headers: data ? { 'Content-Type': 'application/json' } : {},
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: (endpoint: string, data: any) =>
    request(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  delete: (endpoint: string) =>
    request(endpoint, { method: 'DELETE' }),

  /**
   * 认证接口（自动添加 token）
   */
  auth: {
    get: (endpoint: string) => authRequest(endpoint),
    post: (endpoint: string, data?: any) =>
      authRequest(endpoint, {
        method: 'POST',
        headers: data ? { 'Content-Type': 'application/json' } : {},
        body: data ? JSON.stringify(data) : undefined,
      }),
    put: (endpoint: string, data: any) =>
      authRequest(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    delete: (endpoint: string) =>
      authRequest(endpoint, { method: 'DELETE' }),
  },

  /**
   * 工具函数
   */
  utils: {
    getToken,
    getTokenExpiration,
    isTokenExpiringSoon,
    handleAuthError,
  },
};

export default http;