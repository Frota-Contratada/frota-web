import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { contractIaApi, normalizarDataIa } from '../ia/contractIaApi';

describe('contractIaApi - Integração com frota-ia (FastAPI)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('normalizarDataIa converte formato DD-MM-YYYY para YYYY-MM-DD', () => {
    expect(normalizarDataIa('15-08-2026')).toBe('2026-08-15');
    expect(normalizarDataIa('01/01/2026')).toBe('2026-01-01');
    expect(normalizarDataIa('2026-12-31')).toBe('2026-12-31');
    expect(normalizarDataIa(null)).toBeNull();
    expect(normalizarDataIa('')).toBeNull();
    expect(normalizarDataIa('data-invalida')).toBeNull();
  });

  it('rejeita arquivos que não são PDF antes de disparar requisição', async () => {
    const txtFile = new File(['conteudo texto'], 'documento.txt', { type: 'text/plain' });
    await expect(contractIaApi.extrairDados(txtFile)).rejects.toThrow('O arquivo selecionado deve ser no formato PDF.');
  });

  it('rejeita arquivos PDF vazios', async () => {
    const emptyPdf = new File([], 'vazio.pdf', { type: 'application/pdf' });
    await expect(contractIaApi.extrairDados(emptyPdf)).rejects.toThrow('O arquivo PDF selecionado está vazio.');
  });

  it('envia FormData para POST /extrair/ e normaliza resposta da IA', async () => {
    const mockApiResponse = {
      extracao: {
        status: 'sucesso',
        confianca_geral: 0.95,
        observacoes: ['Documento legível'],
      },
      tipo_contrato: ['PASSAGEIROS'],
      fornecedor: {
        nm_fornecedor: 'Transpassos LTDA',
        cnpj_cpf: '12345678000199',
      },
      contrato: {
        dt_vigencia_inicio: '10-02-2026',
        dt_vigencia_fim: '10-02-2027',
      },
      regras: [
        {
          nr_prioridade: 1,
          nm_tipo_regra: 'VALOR_POR_KM',
          nm_tipo_veiculo: 'SEDAN',
          nr_valor_km: 3.5,
        },
      ],
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    });
    globalThis.fetch = fetchSpy;

    const pdfFile = new File(['%PDF-1.4 dummy content'], 'contrato_teste.pdf', { type: 'application/pdf' });
    const result = await contractIaApi.extrairDados(pdfFile);

    expect(fetchSpy).toHaveBeenCalled();
    const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
    expect(calledUrl).toContain('/extrair/');
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.body).toBeInstanceOf(FormData);

    expect(result.extracao.confianca_geral).toBe(0.95);
    expect(result.fornecedor?.nm_fornecedor).toBe('Transpassos LTDA');
    expect(result.datasNormalizadas?.dataVigenciaInicio).toBe('2026-02-10');
    expect(result.datasNormalizadas?.dataVigenciaFim).toBe('2027-02-10');
    expect(result.regras).toHaveLength(1);
    expect(result.regras[0].nr_valor_km).toBe(3.5);
  });

  it('trata erros HTTP e detalha mensagem retornada pelo backend', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'O arquivo enviado está vazio ou corrompido.' }),
    });

    const pdfFile = new File(['fake content'], 'corrompido.pdf', { type: 'application/pdf' });
    await expect(contractIaApi.extrairDados(pdfFile)).rejects.toThrow(
      'Falha na extração com IA: O arquivo enviado está vazio ou corrompido.'
    );
  });
});
