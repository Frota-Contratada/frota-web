export interface PaginatedResponse<T> {
  totalCount: number;
  hasNextPage: boolean;
  data: T[];
}

export interface ApiEnvelope<T> {
  response: T;
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
