import { describe, it, expect, vi } from 'vitest';
import { fetchAllPages } from '../apiHelpers';

const pagina = (data: number[], hasNextPage: boolean) => ({
  response: { totalCount: 5, hasNextPage, data },
});

describe('fetchAllPages', () => {
  it('junta as páginas até a última', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(pagina([1, 2], true))
      .mockResolvedValueOnce(pagina([3, 4], true))
      .mockResolvedValueOnce(pagina([5], false));

    await expect(fetchAllPages<number>(fetchPage)).resolves.toEqual([1, 2, 3, 4, 5]);
    expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([1, 2, 3]);
  });

  it('para no limite de páginas', async () => {
    const fetchPage = vi.fn().mockResolvedValue(pagina([1], true));

    await fetchAllPages<number>(fetchPage, 2);

    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('aceita resposta sem paginação', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ response: [7, 8] });

    await expect(fetchAllPages<number>(fetchPage)).resolves.toEqual([7, 8]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
