export type ApiQueryValue = string | number | boolean | null | undefined;
export type ApiQueryParams = Record<string, ApiQueryValue | ApiQueryValue[]>;

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  query?: ApiQueryParams;
  body?: unknown;
  skipAuth?: boolean;
  _retry?: boolean;
}

export class ApiError<T = unknown> extends Error {
  status: number;
  data: T | null;

  constructor(message: string, status: number, data: T | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_API_URL = 'https://moisture-aloft-unmovable.ngrok-free.dev';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  return (envUrl?.replace(/\/$/, '') || DEFAULT_API_URL);
};

const buildUrl = (path: string, query?: ApiQueryParams) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${getApiBaseUrl()}${normalizedPath}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined) url.searchParams.append(key, String(item));
      });
      return;
    }
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

const readResponse = async <T>(response: Response): Promise<T | null> => {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return response.text() as Promise<T>;
};

const getAuthHeaders = (skipAuth?: boolean): HeadersInit => {
  if (skipAuth) return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(buildUrl('/autenticacao/refresh'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      return null;
    }

    const data = await response.json();
    const newAccessToken = data?.response?.accessToken;
    const newRefreshToken = data?.response?.refreshToken;

    if (newAccessToken) {
      localStorage.setItem('auth_token', newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }
      return newAccessToken;
    }

    return null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { query, body, headers, skipAuth, _retry, ...fetchOptions } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...fetchOptions,
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...getAuthHeaders(skipAuth),
        ...headers,
      },
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Serviço temporariamente indisponível. Tente novamente mais tarde.', 0);
  }

  if (response.status === 401 && !skipAuth && !_retry && !path.includes('/autenticacao/login') && !path.includes('/autenticacao/refresh')) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {

      return request<T>(path, {
        ...options,
        _retry: true,
      });
    }
  }

  const data = await readResponse<T>(response);

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : 'Erro ao comunicar com a API.';
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  request,
  get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' });
  },
  async getBlob(path: string, options?: ApiRequestOptions): Promise<Blob> {
    const { query, headers, skipAuth, body, ...fetchOptions } = options ?? {};
    const response = await fetch(buildUrl(path, query), {
      ...fetchOptions,
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...getAuthHeaders(skipAuth),
        ...headers,
      },
    });
    if (!response.ok) {
      throw new ApiError('Erro ao baixar arquivo.', response.status);
    }
    return response.blob();
  },
  post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'POST', body });
  },
  patch<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'PATCH', body });
  },
  put<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'PUT', body });
  },
  delete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: 'DELETE' });
  },
};

