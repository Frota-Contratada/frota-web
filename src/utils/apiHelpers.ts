export interface PaginatedResponse<T> {
  totalCount: number;
  hasNextPage: boolean;
  data: T[];
}

export interface ApiEnvelope<T> {
  response: T;
}

export interface ListagemQueryParams {
  page?: number;
  limit?: number;
  ordenarPor?: string;
  direcao?: 'asc' | 'desc';
}

export function extractTotalCount(response: unknown): number {
  const nested = (response as { response?: { totalCount?: unknown } } | null)?.response;
  if (nested && typeof nested.totalCount === 'number') return nested.totalCount;
  return extractListData(response).length;
}

export function extractListData<T>(response: unknown): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response as T[];

  if (typeof response === 'object' && response !== null) {
    const obj = response as Record<string, unknown>;

    if (obj.response !== undefined && obj.response !== null) {
      if (Array.isArray(obj.response)) {
        return obj.response as T[];
      }
      if (typeof obj.response === 'object' && obj.response !== null) {
        const nested = obj.response as Record<string, unknown>;
        if (Array.isArray(nested.data)) {
          return nested.data as T[];
        }
      }
    }

    if (Array.isArray(obj.data)) {
      return obj.data as T[];
    }
  }

  return [];
}

export function resolveEmpresaId(explicitEmpresaId?: number): number {
  if (explicitEmpresaId && Number(explicitEmpresaId) > 0) {
    return Number(explicitEmpresaId);
  }

  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson) as { empresaId?: number };
        if (payload?.empresaId && Number(payload.empresaId) > 0) {
          return Number(payload.empresaId);
        }
      }
    }
  } catch {

  }

  return 1;
}
