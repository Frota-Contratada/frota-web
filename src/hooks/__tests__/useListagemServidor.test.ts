import { describe, it, expect, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  LIMITE_LISTA_COMPLETA,
  buscarTodasAsPaginas,
  useListagemServidor,
  type ConsultaPagina,
} from '../useListagemServidor';

type Linha = { id: number; nome: string; uf: string };

const BASE: Linha[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  nome: `Filial ${String(i + 1).padStart(2, '0')}`,
  uf: i % 2 === 0 ? 'SC' : 'PR',
}));

const criarBackend = () =>
  vi.fn(async ({ page, limit, busca, ordenarPor, direcao }: ConsultaPagina) => {
    let lista = BASE.filter((l) => !busca || l.nome.toLowerCase().includes(busca.toLowerCase()));
    if (ordenarPor === 'nome') {
      lista = [...lista].sort((a, b) => a.nome.localeCompare(b.nome) * (direcao === 'desc' ? -1 : 1));
    }
    return { itens: lista.slice((page - 1) * limit, page * limit), total: lista.length };
  });

const filtrar = (linha: Linha, filtros: string[], busca: string) =>
  (filtros.length === 0 || filtros.includes(`uf:${linha.uf}`)) &&
  (!busca || linha.nome.toLowerCase().includes(busca.toLowerCase()));

describe('useListagemServidor', () => {
  it('pagina no servidor e calcula o total de páginas pelo totalCount', async () => {
    const buscarPagina = criarBackend();
    const { result } = renderHook(() =>
      useListagemServidor({ buscarPagina, camposOrdenacao: { nome: 'nome' }, tamanhoPagina: 5, filtrar })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(buscarPagina).toHaveBeenCalledWith({ page: 1, limit: 5, busca: undefined, ordenarPor: undefined, direcao: undefined });
    expect(result.current.itens.map((l) => l.id)).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.totalPaginas).toBe(3);

    act(() => result.current.setPagina(3));
    await waitFor(() => expect(result.current.itens.map((l) => l.id)).toEqual([11, 12]));
    expect(buscarPagina).toHaveBeenCalledWith(expect.objectContaining({ page: 3, limit: 5 }));
  });

  it('envia ordenarPor e direção ao backend para coluna suportada', async () => {
    const buscarPagina = criarBackend();
    const { result } = renderHook(() =>
      useListagemServidor({ buscarPagina, camposOrdenacao: { nome: 'nome' }, tamanhoPagina: 5, filtrar })
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.alterarOrdenacao({ key: 'nome', direction: 'desc' }));

    await waitFor(() => expect(result.current.itens[0]?.id).toBe(12));
    expect(buscarPagina).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 5, ordenarPor: 'nome', direcao: 'desc' })
    );
  });

  it('envia a busca ao backend depois da pausa de digitação', async () => {
    const buscarPagina = criarBackend();
    const { result } = renderHook(() =>
      useListagemServidor({ buscarPagina, camposOrdenacao: {}, tamanhoPagina: 5, filtrar })
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.alterarBusca('filial 1'));

    await waitFor(() => expect(result.current.total).toBe(3));
    expect(buscarPagina).toHaveBeenCalledWith(expect.objectContaining({ page: 1, busca: 'filial 1' }));
  });

  it('com filtro local, filtra e pagina a lista completa na tela', async () => {
    const buscarPagina = criarBackend();
    const { result } = renderHook(() =>
      useListagemServidor({
        buscarPagina,
        camposOrdenacao: { nome: 'nome' },
        tamanhoPagina: 5,
        filtrosLocais: ['uf:PR'],
        filtrar,
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.total).toBe(6);
    expect(result.current.itens.map((l) => l.id)).toEqual([2, 4, 6, 8, 10]);
    expect(result.current.todas).toHaveLength(12);
    const filtrados = await result.current.carregarFiltrados();
    expect(filtrados).toEqual({ itens: expect.any(Array), parcial: false });
    expect(filtrados.itens).toHaveLength(6);
  });

  it('sem carga da lista completa, só busca tudo quando um filtro local ou a exportação pedem', async () => {
    const buscarPagina = criarBackend();
    const { result, rerender } = renderHook(
      ({ filtros }: { filtros: string[] }) =>
        useListagemServidor({
          buscarPagina,
          camposOrdenacao: {},
          tamanhoPagina: 5,
          filtrosLocais: filtros,
          filtrar,
          carregarCompleta: false,
        }),
      { initialProps: { filtros: [] as string[] } }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(buscarPagina).toHaveBeenCalledTimes(1);
    expect(buscarPagina).not.toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
    expect(result.current.todas).toEqual([]);

    const exportados = await result.current.carregarFiltrados();
    expect(exportados.itens).toHaveLength(12);
    expect(buscarPagina).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 100 }));

    rerender({ filtros: ['uf:SC'] });
    await waitFor(() => expect(result.current.total).toBe(6));
    expect(result.current.itens.every((l) => l.uf === 'SC')).toBe(true);
  });

  it('ordena na tela a coluna que o backend não ordena', async () => {
    const buscarPagina = criarBackend();
    const { result } = renderHook(() =>
      useListagemServidor({ buscarPagina, camposOrdenacao: { nome: 'nome' }, tamanhoPagina: 5, filtrar })
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.alterarOrdenacao({ key: 'uf', direction: 'asc' }));

    await waitFor(() => expect(result.current.itens.every((l) => l.uf === 'PR')).toBe(true));
    expect(buscarPagina).not.toHaveBeenCalledWith(expect.objectContaining({ ordenarPor: 'uf' }));
  });

  it('recarrega a página atual e a lista completa', async () => {
    const buscarPagina = criarBackend();
    const { result } = renderHook(() =>
      useListagemServidor({ buscarPagina, camposOrdenacao: {}, tamanhoPagina: 5, filtrar })
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.isLoadingTodas).toBe(false));
    const chamadas = buscarPagina.mock.calls.length;

    act(() => result.current.recarregar());

    await waitFor(() => expect(buscarPagina.mock.calls.length).toBe(chamadas + 2));
  });
});

describe('buscarTodasAsPaginas', () => {
  it('busca em páginas de 100 até completar o total', async () => {
    const total = 230;
    const buscarPagina = vi.fn(async ({ page, limit }: ConsultaPagina) => ({
      itens: Array.from({ length: Math.max(0, Math.min(limit, total - (page - 1) * limit)) }, (_, i) => (page - 1) * limit + i),
      total,
    }));

    const todas = await buscarTodasAsPaginas(buscarPagina);

    expect(todas.itens).toHaveLength(230);
    expect(todas.parcial).toBe(false);
    expect(buscarPagina.mock.calls.map(([c]) => c.page)).toEqual([1, 2, 3]);
    expect(buscarPagina.mock.calls[0][0].limit).toBe(100);
  });

  it('marca a lista como parcial quando o backend tem mais que o limite', async () => {
    const buscarPagina = vi.fn(async ({ limit }: ConsultaPagina) => ({
      itens: Array.from({ length: limit }, (_, i) => i),
      total: LIMITE_LISTA_COMPLETA + 1,
    }));

    const todas = await buscarTodasAsPaginas(buscarPagina);

    expect(todas.itens).toHaveLength(LIMITE_LISTA_COMPLETA);
    expect(todas.parcial).toBe(true);
  });
});
