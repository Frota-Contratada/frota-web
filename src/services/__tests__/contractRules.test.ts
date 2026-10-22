import { describe, it, expect } from 'vitest';
import { montarRegrasContrato, QUALQUER_VEICULO, type RegraEditavel } from '../contract/contractRules';

const tiposVeiculo = [
  { id: 1, nome: 'Sedan' },
  { id: 2, nome: 'Van' },
];

const regra = (parcial: Partial<RegraEditavel>): RegraEditavel => ({
  nr_prioridade: 1,
  nm_tipo_regra: 'VALOR_POR_KM',
  nm_tipo_veiculo: QUALQUER_VEICULO,
  ...parcial,
});

describe('montarRegrasContrato', () => {
  it('maps km rule with bandeirada and no vehicle restriction', () => {
    const { regras, ignoradas } = montarRegrasContrato(
      [regra({ nr_valor_km: 3.5, nr_valor_fixo: 8 })],
      tiposVeiculo,
    );

    expect(ignoradas).toEqual([]);
    expect(regras).toEqual([{ prioridade: 1, tipo: 'VALOR_KM', valorKm: 3.5, valorFixo: 8 }]);
  });

  it('restricts the rule to the vehicle type found in the catalog', () => {
    const { regras } = montarRegrasContrato(
      [regra({ nm_tipo_veiculo: 'van', nr_valor_km: 4 })],
      tiposVeiculo,
    );

    expect(regras[0].condicao).toEqual({ tipoVeiculoIds: [2] });
  });

  it('maps percentual, waiting time and fixed rules', () => {
    const { regras } = montarRegrasContrato(
      [
        regra({ nr_prioridade: 1, nm_tipo_regra: 'VIAGEM_FIXA', nr_valor_fixo: 50 }),
        regra({ nr_prioridade: 2, nm_tipo_regra: 'ACRESCIMO_ZONA_RURAL', nr_percentual: 10 }),
        regra({ nr_prioridade: 3, nm_tipo_regra: 'TEMPO_ESPERA', nr_valor_fixo: 30 }),
      ],
      tiposVeiculo,
    );

    expect(regras.map((r) => r.tipo)).toEqual(['VALOR_FIXO', 'PERCENTUAL', 'TEMPO_ESPERA']);
    expect(regras[1].percentual).toBe(10);
    expect(regras[2].valorFixo).toBe(30);
  });

  it('skips clauses the backend does not price and reports them', () => {
    const { regras, ignoradas } = montarRegrasContrato(
      [
        regra({ nm_tipo_regra: 'PEDAGIO', nr_valor_fixo: 12 }),
        regra({ nm_tipo_regra: 'PARADAS_ADICIONAIS', nr_valor_fixo: 5 }),
      ],
      tiposVeiculo,
    );

    expect(regras).toEqual([]);
    expect(ignoradas).toHaveLength(2);
  });

  it('uses the position as priority when it is missing', () => {
    const { regras } = montarRegrasContrato(
      [regra({ nr_prioridade: 0, nr_valor_km: 2 }), regra({ nr_prioridade: 0, nr_valor_km: 3 })],
      tiposVeiculo,
    );

    expect(regras.map((r) => r.prioridade)).toEqual([1, 2]);
  });
});
