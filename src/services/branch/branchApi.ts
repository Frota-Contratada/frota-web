import { apiClient } from '../api/apiClient';
import { getAccessTokenClaims } from '../../utils/jwt';

export interface EnderecoDto {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  latitude: number;
  longitude: number;
}

export interface FilialDto {
  id: number;
  empresaId?: number;
  nome: string;
  cnpj: string;
  endereco: EnderecoDto;
}

export interface CriarFilialParams {
  nome: string;
  cnpj: string;
  administradorId: number;
  endereco: EnderecoDto;
}

export interface AtualizarFilialParams {
  nome: string;
  endereco: EnderecoDto;
}

export interface BuscarFiliaisQueryParams {
  nome?: string;
  cnpj?: string;
  endereco?: string;
  page?: number;
  limit?: number;
}

export interface FilialResponse {
  response: FilialDto;
}

export interface PaginatedFiliais {
  totalCount: number;
  hasNextPage: boolean;
  data: FilialDto[];
}

export interface FiliaisListResponse {
  response: PaginatedFiliais | FilialDto[];
}

export interface SubstituirAdministradoresParams {
  administradorIds: number[];
}

const empresaPorFilial = new Map<number, number>();
let empresaPadrao: number | undefined;

const listarFiliais = (query?: BuscarFiliaisQueryParams) =>
  apiClient.get<FiliaisListResponse>('/filial', { query: query as Record<string, string | number | boolean | null | undefined> });

const extrairFiliais = (res: FiliaisListResponse): { data: FilialDto[]; hasNextPage: boolean } => {
  const payload = res?.response;
  if (Array.isArray(payload)) return { data: payload, hasNextPage: false };
  return { data: payload?.data ?? [], hasNextPage: Boolean(payload?.hasNextPage) };
};

const memorizar = (filiais: FilialDto[]) => {
  filiais.forEach((f) => {
    if (f.empresaId) {
      empresaPorFilial.set(Number(f.id), Number(f.empresaId));
      if (!empresaPadrao) empresaPadrao = Number(f.empresaId);
    }
  });
};

export async function resolveEmpresaId(filialId?: number): Promise<number | undefined> {
  if (filialId && empresaPorFilial.has(filialId)) return empresaPorFilial.get(filialId);
  if (!filialId && empresaPadrao) return empresaPadrao;

  const claims = getAccessTokenClaims();
  if (claims?.empresaId && (!filialId || claims.filialId === filialId)) {
    return Number(claims.empresaId);
  }

  try {
    for (let page = 1; page <= 20; page += 1) {
      const { data, hasNextPage } = extrairFiliais(await listarFiliais({ page, limit: 100 }));
      memorizar(data);
      if (filialId && empresaPorFilial.has(filialId)) return empresaPorFilial.get(filialId);
      if (!filialId && empresaPadrao) return empresaPadrao;
      if (!hasNextPage) break;
    }
  } catch {
  }

  return claims?.empresaId ? Number(claims.empresaId) : empresaPadrao;
}

export const branchApi = {
  async create(data: Omit<CriarFilialParams, 'empresaId'> & { empresaId?: number }) {
    const empresaId = data.empresaId ?? (await resolveEmpresaId());
    return apiClient.post<FilialResponse>('/filial', { ...data, empresaId });
  },

  async list(query?: BuscarFiliaisQueryParams) {
    const res = await listarFiliais(query);
    memorizar(extrairFiliais(res).data);
    return res;
  },

  async getById(id: number, empresaId?: number) {
    const empresa = empresaId ?? (await resolveEmpresaId(id));
    return apiClient.get<FilialResponse>(`/filial/${id}`, { query: { empresaId: empresa } });
  },

  async update(id: number, data: AtualizarFilialParams, empresaId?: number) {
    const empresa = empresaId ?? (await resolveEmpresaId(id));
    return apiClient.patch<FilialResponse>(`/filial/${id}`, data, { query: { empresaId: empresa } });
  },

  async substituirAdministradores(id: number, data: SubstituirAdministradoresParams, empresaId?: number) {
    const empresa = empresaId ?? (await resolveEmpresaId(id));
    return apiClient.put<void>(`/filial/${id}/administradores`, data, { query: { empresaId: empresa } });
  },
};

