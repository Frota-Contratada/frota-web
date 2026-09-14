import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationApi } from '../notification/notificationApi';
import { apiClient } from '../api/apiClient';

describe('notificationApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls getUnreadCount with GET /notificacoes/nao-lidas/quantidade', async () => {
    const mockRes = { response: { quantidade: 4 } };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockRes);

    const result = await notificationApi.getUnreadCount();

    expect(getSpy).toHaveBeenCalledWith('/notificacoes/nao-lidas/quantidade');
    expect(result.response.quantidade).toBe(4);
  });

  it('calls list with GET /notificacoes', async () => {
    const mockList = {
      response: [
        {
          id: 'notif-1',
          tipo: 'SOLICITACAO_CRIADA',
          titulo: 'Nova corrida',
          mensagem: 'Corrida solicitada com sucesso',
          criadaEm: '2026-09-13T10:00:00Z',
          expiraEm: '2026-09-20T10:00:00Z',
          lidaEm: null,
        },
      ],
    };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockList);

    const result = await notificationApi.list();

    expect(getSpy).toHaveBeenCalledWith('/notificacoes');
    expect(result.response).toHaveLength(1);
    expect(result.response[0].titulo).toBe('Nova corrida');
  });

  it('calls markAsRead with PATCH /notificacoes/:id/lida', async () => {
    const mockRes = {
      response: {
        id: 'notif-1',
        tipo: 'SOLICITACAO_CRIADA',
        titulo: 'Nova corrida',
        mensagem: 'Corrida solicitada com sucesso',
        criadaEm: '2026-09-13T10:00:00Z',
        expiraEm: '2026-09-20T10:00:00Z',
        lidaEm: '2026-09-13T12:00:00Z',
      },
    };
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockRes);

    const result = await notificationApi.markAsRead('notif-1');

    expect(patchSpy).toHaveBeenCalledWith('/notificacoes/notif-1/lida', {});
    expect(result.response.lidaEm).not.toBeNull();
  });
});
