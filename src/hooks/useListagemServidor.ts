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

  buscarPagina: BuscarPagina<T>;

  camposOrdenacao: Partial<Record<string, string>>;
  tamanhoPagina: number;

  filtrosLocais?: string[];

  filtrar?: Filtrar<T>;

  buscaNoServidor?: boolean;

  carregarCompleta?: boolean;
}

const LIMITE_POR_REQUISICAO = 100;
const MAXIMO_PAGINAS = 50;
const ESPERA_BUSCA_MS = 400;

export const LIMITE_LISTA_COMPLETA = LIMITE_POR_REQUISICAO * MAXIMO_PAGINAS;

export interface ListaCompleta<T> {
  itens: T[];

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

  const itensFiltrados = useMemo(
    () => aplicarNaTela(todas, filtrar, filtros, buscaAplicada, ordenacao),
    [todas, filtrar, filtros, buscaAplicada, ordenacao]
  );

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
