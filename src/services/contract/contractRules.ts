export type TipoRegraApi = 'VALOR_KM' | 'VALOR_FIXO' | 'PERCENTUAL' | 'TEMPO_ESPERA';

export interface RegraContratoPayload {
  prioridade: number;
  tipo: TipoRegraApi;
  valorKm?: number;
  valorFixo?: number;
  percentual?: number;
  condicao?: { tipoVeiculoIds: number[] };
}

export interface RegraEditavel {
  nr_prioridade: number;
  nm_tipo_regra: string;
  nm_tipo_veiculo: string;
  nr_valor_km?: number | null;
  nr_valor_fixo?: number | null;
  nr_percentual?: number | null;
}

export interface TipoVeiculoCatalogo {
  id: number;
  nome: string;
}

export const QUALQUER_VEICULO = 'Qualquer veículo';

/** Tipos da tela (os mesmos da extração por IA) que o backend ainda não cobra como regra. */
const TIPOS_SEM_REGRA: Record<string, string> = {
  PARADAS_ADICIONAIS: 'Parada adicional',
  PEDAGIO: 'Pedágio (lançado na corrida pelo motorista ou fornecedor)',
};

const numero = (valor?: number | null) =>
  valor == null || Number.isNaN(Number(valor)) ? undefined : Number(valor);

/**
 * Converte as regras editadas na tela para o contrato de `PUT /contrato/:id/regras`.
 * Regras de km aceitam bandeirada (valor fixo); "Qualquer veículo" não restringe a regra.
 */
export function montarRegrasContrato(
  regras: RegraEditavel[],
  tiposVeiculo: TipoVeiculoCatalogo[],
): { regras: RegraContratoPayload[]; ignoradas: string[] } {
  const payload: RegraContratoPayload[] = [];
  const ignoradas: string[] = [];

  regras.forEach((regra, indice) => {
    if (TIPOS_SEM_REGRA[regra.nm_tipo_regra]) {
      ignoradas.push(TIPOS_SEM_REGRA[regra.nm_tipo_regra]);
      return;
    }

    const tipoVeiculo = tiposVeiculo.find(
      (tipo) => tipo.nome.toLowerCase() === regra.nm_tipo_veiculo.toLowerCase(),
    );
    const condicao = tipoVeiculo ? { condicao: { tipoVeiculoIds: [tipoVeiculo.id] } } : {};
    const base = { prioridade: regra.nr_prioridade || indice + 1, ...condicao };
    const valorKm = numero(regra.nr_valor_km);
    const valorFixo = numero(regra.nr_valor_fixo);
    const percentual = numero(regra.nr_percentual);

    switch (regra.nm_tipo_regra) {
      case 'VALOR_POR_KM':
        payload.push({
          ...base,
          tipo: 'VALOR_KM',
          valorKm: valorKm ?? 0,
          ...(valorFixo != null ? { valorFixo } : {}),
        });
        return;
      case 'ACRESCIMO_ZONA_RURAL':
        payload.push({ ...base, tipo: 'PERCENTUAL', percentual: percentual ?? 0 });
        return;
      case 'TEMPO_ESPERA':
        payload.push({ ...base, tipo: 'TEMPO_ESPERA', valorFixo: valorFixo ?? 0 });
        return;
      default:
        payload.push({ ...base, tipo: 'VALOR_FIXO', valorFixo: valorFixo ?? 0 });
    }
  });

  return { regras: payload, ignoradas };
}
