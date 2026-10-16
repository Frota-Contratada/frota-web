import { apiClient } from '../api/apiClient';
import { getAccessTokenClaims } from '../../utils/jwt';
import { cleanCnpj, cleanCep } from '../../utils';

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

const memorizar = (filiais: any[]) => {
  if (!Array.isArray(filiais)) return;
  filiais.forEach((f) => {
    const eid = f?.empresaId ?? f?.nCdEmpresa;
    const fid = f?.id ?? f?.nCdFilial;
    if (eid && fid) {
      const numEid = Number(eid);
      const numFid = Number(fid);
      if (!isNaN(numEid) && numEid > 0 && !isNaN(numFid) && numFid > 0) {
        empresaPorFilial.set(numFid, numEid);
        if (!empresaPadrao) empresaPadrao = numEid;
      }
    }
  });
};

export async function resolveEmpresaId(filialId?: number): Promise<number> {
  const numId = filialId && !isNaN(Number(filialId)) ? Number(filialId) : undefined;
  if (numId && empresaPorFilial.has(numId)) return empresaPorFilial.get(numId)!;
  if (!numId && empresaPadrao) return empresaPadrao;

  const claims = getAccessTokenClaims();
  if (claims?.empresaId && (!numId || Number(claims.filialId) === numId)) {
    const claimEid = Number(claims.empresaId);
    if (!isNaN(claimEid) && claimEid > 0) return claimEid;
  }

  try {
    for (let page = 1; page <= 20; page += 1) {
      const { data, hasNextPage } = extrairFiliais(await listarFiliais({ page, limit: 100 }));
      memorizar(data);
      if (numId && empresaPorFilial.has(numId)) return empresaPorFilial.get(numId)!;
      if (!numId && empresaPadrao) return empresaPadrao;
      if (!hasNextPage) break;
    }
  } catch {
  }

  const fallback = claims?.empresaId ? Number(claims.empresaId) : (empresaPadrao ?? 1);
  return !isNaN(fallback) && fallback > 0 ? fallback : 1;
}

export const branchApi = {
  async create(data: Omit<CriarFilialParams, 'empresaId'> & { empresaId?: number }) {
    const resolved = await resolveEmpresaId();
    const empresaId = Number(data.empresaId ?? (resolved > 0 ? resolved : 1));
    const cnpj = cleanCnpj(data.cnpj);
    const payload = {
      ...data,
      cnpj,
      empresaId,
      administradorId: Number(data.administradorId || 1),
      endereco: {
        ...data.endereco,
        cep: cleanCep(data.endereco.cep),
        numero: String(data.endereco.numero || '100').trim(),
        uf: String(data.endereco.uf || 'SC').trim().toUpperCase().slice(0, 2),
        latitude: Number(data.endereco.latitude) || 0,
        longitude: Number(data.endereco.longitude) || 0,
      },
    };
    return apiClient.post<FilialResponse>('/filial', payload);
  },

  async list(query?: BuscarFiliaisQueryParams) {
    const res = await listarFiliais(query);
    memorizar(extrairFiliais(res).data);
    return res;
  },

  async getById(id: number, empresaId?: number) {
    const numId = Number(id);
    const resolved = empresaId ?? (await resolveEmpresaId(numId));
    const empresa = Number(resolved > 0 ? resolved : 1);
    return apiClient.get<FilialResponse>(`/filial/${numId}`, { query: { empresaId: empresa } });
  },

  async update(id: number, data: AtualizarFilialParams, empresaId?: number) {
    const numId = Number(id);
    const resolved = empresaId ?? (await resolveEmpresaId(numId));
    const empresa = Number(resolved > 0 ? resolved : 1);
    const payload = {
      nome: data.nome,
      endereco: {
        ...data.endereco,
        cep: cleanCep(data.endereco.cep),
        numero: String(data.endereco.numero || '100').trim(),
        uf: String(data.endereco.uf || 'SC').trim().toUpperCase().slice(0, 2),
        latitude: Number(data.endereco.latitude) || 0,
        longitude: Number(data.endereco.longitude) || 0,
      },
    };
    return apiClient.patch<FilialResponse>(`/filial/${numId}`, payload, { query: { empresaId: empresa } });
  },

  async substituirAdministradores(id: number, data: SubstituirAdministradoresParams, empresaId?: number) {
    const numId = Number(id);
    const resolved = empresaId ?? (await resolveEmpresaId(numId));
    const empresa = Number(resolved > 0 ? resolved : 1);
    return apiClient.put<void>(`/filial/${numId}/administradores`, data, { query: { empresaId: empresa } });
  },
};

