import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SortState } from '../components/common';

export type DirecaoOrdenacao = 'asc' | 'desc';

export interface ConsultaPagina {
  page: number;
  limit: number;
  busca?: string;
  ordenarPor?: string;
  direcao?: DirecaoOrdenacao;
}

export interface PaginaListagem<T> {
  itens: T[];
  total: number;
}

export type BuscarPagina<T> = (consulta: ConsultaPagina) => Promise<PaginaListagem<T>>;

type Filtrar<T> = (item: T, filtros: string[], busca: string) => boolean;

interface OpcoesListagemServidor<T> {
  /** Busca uma página no backend, já convertida em linhas da tabela. Use useCallback. */
  buscarPagina: BuscarPagina<T>;
  /** Coluna da tabela → campo `ordenarPor` aceito pelo backend. */
  camposOrdenacao: Partial<Record<string, string>>;
  tamanhoPagina: number;
  /** Filtros que o backend não aplica (campos calculados na tela). */
  filtrosLocais?: string[];
  /** Aplica filtros locais e a busca na lista completa. Use useCallback. */
  filtrar?: Filtrar<T>;
  /** Sem busca por texto no backend, a busca vira filtro local. */
  buscaNoServidor?: boolean;
  /**
   * Carrega a lista completa ao abrir a tela (para opções de filtro e totais).
   * Desligado, ela só é buscada quando um filtro local ou a exportação precisam.
   */
  carregarCompleta?: boolean;
}

const LIMITE_POR_REQUISICAO = 100;
const MAXIMO_PAGINAS = 50;
const ESPERA_BUSCA_MS = 400;

/** Máximo de registros da lista completa (filtros locais e exportação). */
export const LIMITE_LISTA_COMPLETA = LIMITE_POR_REQUISICAO * MAXIMO_PAGINAS;

export interface ListaCompleta<T> {
  itens: T[];
  /** O backend tem mais registros do que o limite da lista completa. */
  parcial: boolean;
}

export async function buscarTodasAsPaginas<T>(buscarPagina: BuscarPagina<T>): Promise<ListaCompleta<T>> {
  const itens: T[] = [];
  let total = 0;
  for (let page = 1; page <= MAXIMO_PAGINAS; page++) {
    const pagina = await buscarPagina({ page, limit: LIMITE_POR_REQUISICAO });
    itens.push(...pagina.itens);
    total = pagina.total;
    if (pagina.itens.length < LIMITE_POR_REQUISICAO || itens.length >= total) break;
  }
  return { itens, parcial: total > itens.length };
}

function compararValores(a: unknown, b: unknown): number {
  if (a == null) return 1;
  if (b == null) return -1;
  return typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a).localeCompare(String(b), 'pt-BR', { numeric: true });
}

function aplicarNaTela<T>(
  lista: T[],
  filtrar: Filtrar<T> | undefined,
  filtros: string[],
  busca: string,
  ordenacao: SortState | null
): T[] {
  const filtrados = filtrar ? lista.filter((item) => filtrar(item, filtros, busca)) : lista;
  if (!ordenacao) return filtrados;
  return [...filtrados].sort((a, b) => {
    const cmp = compararValores(
      (a as Record<string, unknown>)[ordenacao.key],
      (b as Record<string, unknown>)[ordenacao.key]
    );
    return ordenacao.direction === 'asc' ? cmp : -cmp;
  });
}

/**
 * Tabela paginada, buscada e ordenada no backend. Com filtro que só existe na
 * tela, busca sem suporte no backend ou ordenação por coluna calculada, usa a
 * lista completa (carregada em páginas de 100, até LIMITE_LISTA_COMPLETA) e
 * aplica tudo localmente. A lista completa também serve à exportação e, quando
 * carregada ao abrir, às opções de filtro e aos totais.
 */
export function useListagemServidor<T>({
  buscarPagina,
  camposOrdenacao,
  tamanhoPagina,
  filtrosLocais = [],
  filtrar,
  buscaNoServidor = true,
  carregarCompleta = true,
}: OpcoesListagemServidor<T>) {
  const [pagina, setPagina] = useState(1);
  const [ordenacao, setOrdenacao] = useState<SortState | null>(null);
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [erro, setErro] = useState<Error | null>(null);
  const [versao, setVersao] = useState(0);
  const [completa, setCompleta] = useState<{
    fonte: BuscarPagina<T> | null;
    versao: number;
    lista: ListaCompleta<T>;
  }>({ fonte: null, versao: 0, lista: { itens: [], parcial: false } });
  const [respostaPagina, setRespostaPagina] = useState<{
    consulta: unknown;
    pagina: PaginaListagem<T>;
  }>({ consulta: null, pagina: { itens: [], total: 0 } });

  useEffect(() => {
    const timer = setTimeout(() => setBuscaAplicada(busca.trim()), ESPERA_BUSCA_MS);
    return () => clearTimeout(timer);
  }, [busca]);

  const campoServidor = ordenacao ? camposOrdenacao[ordenacao.key] : undefined;
  const chaveFiltros = filtrosLocais.join('|');
  const filtros = useMemo(() => (chaveFiltros ? chaveFiltros.split('|') : []), [chaveFiltros]);
  const modoLocal =
    filtros.length > 0 ||
    (!buscaNoServidor && buscaAplicada.length > 0) ||
    (ordenacao != null && campoServidor == null);
  const precisaCompleta = carregarCompleta || modoLocal;
  const completaAtual = completa.fonte === buscarPagina && completa.versao === versao;

  useEffect(() => {
    if (!precisaCompleta || completaAtual) return;
    let ativo = true;
    buscarTodasAsPaginas(buscarPagina)
      .then((lista) => {
        if (ativo) setCompleta({ fonte: buscarPagina, versao, lista });
      })
      .catch((e: unknown) => {
        if (!ativo) return;
        setErro(e instanceof Error ? e : new Error(String(e)));
        setCompleta({ fonte: buscarPagina, versao, lista: { itens: [], parcial: false } });
      });
    return () => {
      ativo = false;
    };
  }, [buscarPagina, versao, precisaCompleta, completaAtual]);

  const consulta = useMemo(
    () =>
      modoLocal
        ? null
        : {
            fonte: buscarPagina,
            versao,
            page: pagina,
            limit: tamanhoPagina,
            busca: buscaNoServidor && buscaAplicada ? buscaAplicada : undefined,
            ordenarPor: campoServidor,
            direcao: campoServidor ? ordenacao?.direction : undefined,
          },
    [modoLocal, buscarPagina, versao, pagina, tamanhoPagina, buscaNoServidor, buscaAplicada, campoServidor, ordenacao?.direction]
  );

  useEffect(() => {
    if (!consulta) return;
    let ativo = true;
    const { page, limit, busca: termo, ordenarPor, direcao } = consulta;
    consulta
      .fonte({ page, limit, busca: termo, ordenarPor, direcao })
      .then((resultado) => {
        if (ativo) setRespostaPagina({ consulta, pagina: resultado });
      })
      .catch((e: unknown) => {
        if (!ativo) return;
        setErro(e instanceof Error ? e : new Error(String(e)));
        setRespostaPagina({ consulta, pagina: { itens: [], total: 0 } });
      });
    return () => {
      ativo = false;
    };
  }, [consulta]);

  const todas = useMemo(
    () => (completaAtual ? completa.lista.itens : []),
    [completaAtual, completa.lista.itens]
  );

  // Lista completa com filtros, busca e ordenação aplicados na tela.
  const itensFiltrados = useMemo(
    () => aplicarNaTela(todas, filtrar, filtros, buscaAplicada, ordenacao),
    [todas, filtrar, filtros, buscaAplicada, ordenacao]
  );

  /** Lista completa filtrada para exportar; busca no backend se ainda não estiver carregada. */
  const carregarFiltrados = useCallback(async (): Promise<ListaCompleta<T>> => {
    const lista = completaAtual ? completa.lista : await buscarTodasAsPaginas(buscarPagina);
    return {
      itens: aplicarNaTela(lista.itens, filtrar, filtros, buscaAplicada, ordenacao),
      parcial: lista.parcial,
    };
  }, [completaAtual, completa.lista, buscarPagina, filtrar, filtros, buscaAplicada, ordenacao]);

  const total = modoLocal ? itensFiltrados.length : respostaPagina.pagina.total;
  const itens = modoLocal
    ? itensFiltrados.slice((pagina - 1) * tamanhoPagina, pagina * tamanhoPagina)
    : respostaPagina.pagina.itens;

  const alterarBusca = useCallback((valor: string) => {
    setBusca(valor);
    setPagina(1);
  }, []);

  const alterarOrdenacao = useCallback((valor: SortState | null) => {
    setOrdenacao(valor);
    setPagina(1);
  }, []);

  /** Busca de novo a página atual e a lista completa (por exemplo, após um cadastro). */
  const recarregar = useCallback(() => setVersao((atual) => atual + 1), []);

  return {
    itens,
    todas,
    listaParcial: completaAtual && completa.lista.parcial,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / tamanhoPagina)),
    pagina,
    setPagina,
    busca,
    alterarBusca,
    alterarOrdenacao,
    carregarFiltrados,
    isLoading: modoLocal ? !completaAtual : respostaPagina.consulta !== consulta,
    isLoadingTodas: precisaCompleta && !completaAtual,
    erro,
    recarregar,
  };
}
