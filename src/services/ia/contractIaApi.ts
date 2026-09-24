export interface RegraExtracaoIa {
  nr_prioridade: number;
  nm_tipo_regra: 'VIAGEM_FIXA' | 'VALOR_POR_KM' | 'ACRESCIMO_ZONA_RURAL' | 'TEMPO_ESPERA' | 'PARADAS_ADICIONAIS' | 'TIPO_VEICULO' | 'PEDAGIO' | string;
  nm_tipo_veiculo: string;
  nr_valor_fixo?: number;
  nr_valor_km?: number;
  nr_percentual?: number;
  tipo_espera?: 'HORA' | 'MINUTO';
  qnt_espera?: number;
  localidade?: string;
  zona?: 'URBANA' | 'RURAL';
  condicoes?: unknown[];
}

export interface ExtracaoResultadoIa {
  extracao: {
    status: 'sucesso' | 'falha' | string;
    confianca_geral: number;
    observacoes: string[];
  };
  tipo_contrato: string[];
  fornecedor: {
    nm_fornecedor: string | null;
    cnpj_cpf: string | null;
  } | null;
  contrato: {
    dt_vigencia_inicio: string | null; // Formato original retornado pela IA: DD-MM-YYYY
    dt_vigencia_fim: string | null;    // Formato original retornado pela IA: DD-MM-YYYY
  } | null;
  regras: RegraExtracaoIa[];
  // Campos normalizados para uso direto no frontend frota-web:
  datasNormalizadas?: {
    dataVigenciaInicio: string | null; // Formato YYYY-MM-DD
    dataVigenciaFim: string | null;    // Formato YYYY-MM-DD
  };
}

/**
 * Converte data de formato DD-MM-YYYY para YYYY-MM-DD (padrão HTML5 date e Zod date).
 */
export function normalizarDataIa(dataStr?: string | null): string | null {
  if (!dataStr || typeof dataStr !== 'string') return null;
  const trimmed = dataStr.trim();
  const match = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(trimmed);
  if (match) {
    const [, dia, mes, ano] = match;
    return `${ano}-${mes}-${dia}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

const getIaApiUrl = (): string => {
  const url = import.meta.env.VITE_IA_API_URL;
  if (!url && import.meta.env.PROD) {
    throw new Error('VITE_IA_API_URL is required for a production build.');
  }
  return (url || 'http://localhost:8000').replace(/\/+$/, '');
};

export const contractIaApi = {
  /**
   * Envia o buffer binário de um arquivo PDF para a API do frota-ia (POST /extrair/)
   * e retorna os dados de contrato, fornecedor e regras financeiras validadas.
   */
  async extrairDados(file: File): Promise<ExtracaoResultadoIa> {
    const nome = file.name || '';
    if (!nome.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      throw new Error('O arquivo selecionado deve ser no formato PDF.');
    }
    if (file.size === 0) {
      throw new Error('O arquivo PDF selecionado está vazio.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const baseUrl = getIaApiUrl();
    const endpoint = `${baseUrl}/extrair/`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
    } catch {
      try {
        response = await fetch('/extrair/', {
          method: 'POST',
          body: formData,
        });
      } catch {
        throw new Error(
          `Falha na comunicação com o microserviço de IA (${baseUrl}). Verifique se o serviço frota-ia está em execução na porta 8000.`
        );
      }
    }

    if (!response.ok) {
      let errorDetail = `Erro HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // Fallback de texto se não for JSON
        const text = await response.text();
        if (text) errorDetail = text;
      }
      throw new Error(`Falha na extração com IA: ${errorDetail}`);
    }

    const data: ExtracaoResultadoIa = await response.json();

    // Normalização das datas para YYYY-MM-DD
    const dtInicio = normalizarDataIa(data.contrato?.dt_vigencia_inicio);
    const dtFim = normalizarDataIa(data.contrato?.dt_vigencia_fim);

    return {
      ...data,
      datasNormalizadas: {
        dataVigenciaInicio: dtInicio,
        dataVigenciaFim: dtFim,
      },
    };
  },
};
