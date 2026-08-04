export type ApiQueryValue = string | number | boolean | null | undefined;
export type ApiQueryParams = Record<string, ApiQueryValue | ApiQueryValue[]>;

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  query?: ApiQueryParams;
  body?: unknown;
  skipAuth?: boolean;
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

const DEFAULT_API_URL = 'http://localhost:3000';

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

export const apiClient = {
  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { query, body, headers, skipAuth, ...fetchOptions } = options;

    let response: Response;
    try {
      response = await fetch(buildUrl(path, query), {
        ...fetchOptions,
        headers: {
          Accept: 'application/json',
          ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...getAuthHeaders(skipAuth),
          ...headers,
        },
        body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError('Serviço temporariamente indisponível. Tente novamente mais tarde.', 0);
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
  },

  get<T>(path: string, options?: ApiRequestOptions) {
    return this.request<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<T>(path, { ...options, method: 'POST', body });
  },
  patch<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  },
  put<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  },
  delete<T>(path: string, options?: ApiRequestOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  },
};
