import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EmployeeCreate } from '../EmployeeCreate';
import { ToastProvider } from '../../../../components/common/Toast/Toast';
import { branchApi, collaboratorApi, costCenterApi } from '../../../../services';
import { useAuthStore } from '../../../../stores/authStore';
import type { UserProfile } from '../../../../types/profile.types';

const pagina = <T,>(data: T[], hasNextPage = false) => ({
  response: { totalCount: data.length, hasNextPage, data },
});

const centroComAprovador = { empresaId: 30, filialId: 704, numero: 4704, nome: 'Gastos administrativos', ativo: true, temAprovador: true };

const entrarComo = (profile: UserProfile) => {
  useAuthStore.getState().login({ id: '1', name: 'Admin', email: 'admin@frota.com.br', profile }, 'tok', 'ref');
};

const renderizar = () =>
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/colaboradores/novo']}>
        <Routes>
          <Route path="/colaboradores/novo" element={<EmployeeCreate />} />
          <Route path="/colaboradores" element={<div>Lista de colaboradores</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );

// Preenche direto em vez de digitar letra a letra, que deixava o teste lento sob carga.
const preencherDados = async () => {
  fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'Visitante da Feira' } });
  fireEvent.change(screen.getByLabelText(/email corporativo/i), { target: { value: 'visitante@exemplo.com' } });
};

describe('EmployeeCreate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('cadastra pela API na própria filial quando o usuário é admin de filial', async () => {
    entrarComo('admin-filial');
    const listFilial = vi.spyOn(costCenterApi, 'listFilial').mockResolvedValue(pagina([centroComAprovador]) as never);
    const create = vi.spyOn(collaboratorApi, 'create').mockResolvedValue({ response: { id: 9200 } } as never);

    renderizar();
    await preencherDados();
    await waitFor(() => expect(listFilial).toHaveBeenCalled());
    await userEvent.click(await screen.findByRole('button', { name: /selecione/i }));
    await userEvent.click(await screen.findByRole('option', { name: /4704/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Colaborador' }));

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith({
      nome: 'Visitante da Feira',
      email: 'visitante@exemplo.com',
      cpf: undefined,
      cargo: 'Analista',
      centroCustoId: 4704,
      perfis: ['solicitante'],
    });
    expect(await screen.findByText('Lista de colaboradores')).toBeInTheDocument();
  });

  it('envia a filial escolhida pelo admin master e busca os centros de custo dela', async () => {
    entrarComo('admin-master');
    vi.spyOn(branchApi, 'list').mockResolvedValue(
      pagina([{ id: 704, empresaId: 30, nome: 'ROLÂNDIA', cnpj: '00000000000191' }]) as never
    );
    const listAdmin = vi.spyOn(costCenterApi, 'listAdmin').mockResolvedValue(pagina([centroComAprovador]) as never);
    const create = vi.spyOn(collaboratorApi, 'create').mockResolvedValue({ response: { id: 9200 } } as never);

    renderizar();
    await preencherDados();
    // Antes de escolher a filial, filial e centro de custo mostram "Selecione".
    const [selectFilial] = await screen.findAllByRole('button', { name: /selecione/i });
    await userEvent.click(selectFilial);
    await userEvent.click(await screen.findByRole('option', { name: /ROLÂNDIA/ }));
    await waitFor(() =>
      expect(listAdmin).toHaveBeenCalledWith({ empresaId: 30, filialId: 704, page: 1, limit: 100 })
    );
    await userEvent.click(await screen.findByRole('button', { name: /selecione/i }));
    await userEvent.click(await screen.findByRole('option', { name: /4704/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Colaborador' }));

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ empresaId: 30, filialId: 704, centroCustoId: 4704 }));
  });

  it('não chama a API com perfil de emergência sem solicitante', async () => {
    entrarComo('admin-filial');
    vi.spyOn(costCenterApi, 'listFilial').mockResolvedValue(pagina([centroComAprovador]) as never);
    const create = vi.spyOn(collaboratorApi, 'create');

    renderizar();
    await preencherDados();
    await userEvent.click(await screen.findByRole('button', { name: /selecione/i }));
    await userEvent.click(await screen.findByRole('option', { name: /4704/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Solicitante Selecionado/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Aprovador/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Solicitante de Emergência/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Colaborador' }));

    expect(await screen.findByText('O perfil de emergência exige também o perfil de solicitante')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});
