import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RideReview } from '../RideReview';
import { ridesApi, supplierApi } from '../../../../services';
import { useAuthStore } from '../../../../stores/authStore';

const showToast = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => ({
  ...await importOriginal<typeof import('react-router-dom')>(),
  useNavigate: () => mockNavigate,
  useParams: () => ({ requestId: '101' }),
}));

vi.mock('../../../../components/maps/RouteMap/RouteMap', () => ({
  RouteMap: () => <div data-testid="route-map" />,
}));

vi.mock('../../../../components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../components/common')>();
  return {
    ...actual,
    useToast: () => ({ showToast }),
  };
});

vi.mock('../../../../services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../services')>();
  return {
    ...actual,
    ridesApi: {
      getById: vi.fn(),
      aprovar: vi.fn(),
      reprovar: vi.fn(),
      getMotivosCancelamento: vi.fn().mockResolvedValue({ response: [] }),
      getMotivosRecusa: vi.fn().mockResolvedValue({ response: [] }),
    },
    supplierApi: {
      list: vi.fn(),
    },
    extractListData: (res: any) => {
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.response)) return res.response;
      return [];
    },
  };
});

describe('RideReview Functional Logic & Business Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: '10',
        name: 'Aprovador Teste',
        email: 'aprovador@empresa.com',
        profile: 'aprovador',
        perfis: [{ tipoPerfil: 'APROVADOR', dataInicioVigencia: '2026-01-01' }],
      },
    });

    vi.mocked(supplierApi.list).mockResolvedValue({
      response: [
        { id: 201, nome: 'Viação Alpha', cnpj: '11.111.111/0001-11', ativo: true },
        { id: 202, nome: 'Viação Beta', cnpj: '22.222.222/0001-22', ativo: true },
      ],
    } as any);
  });

  it('allows primary cost center approver to select supplier and approve with fornecedorId', async () => {
    vi.mocked(ridesApi.getById).mockResolvedValue({
      response: {
        id: 101,
        status: 'PENDENTE',
        solicitanteId: 99,
        solicitanteNome: 'Outro Solicitante',
        dataCorrida: '2026-10-20T10:00:00Z',
        origem: { logradouro: 'Rua A', numero: '100' },
        destino: { logradouro: 'Rua B', numero: '200' },
        centrosCusto: [
          { centroCustoId: 1, centroCustoNome: 'Operações (Principal)', aprovadorId: 10 },
          { centroCustoId: 2, centroCustoNome: 'Marketing (Rateio)', aprovadorId: 20 },
        ],
      },
    } as any);

    vi.mocked(ridesApi.aprovar).mockResolvedValue({ response: { id: 101, status: 'APROVADA' } } as any);

    render(<RideReview />);

    await waitFor(() => expect(ridesApi.getById).toHaveBeenCalledWith(101));

    expect(screen.getByRole('heading', { name: 'Informações da corrida' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));

    await waitFor(() => expect(screen.getByText('Viação Alpha')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Viação Alpha'));

    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Revisar tudo' })).toBeInTheDocument());
    const approveBtn = screen.getByRole('button', { name: /aprovar solicitação/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {

      expect(ridesApi.aprovar).toHaveBeenCalledWith(101, 201);
      expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    });
  });

  it('does not require or send supplier when secondary cost center approver (rateio) approves', async () => {

    useAuthStore.setState({
      user: {
        id: '20',
        name: 'Aprovador Rateio',
        email: 'rateio@empresa.com',
        profile: 'aprovador',
        perfis: [{ tipoPerfil: 'APROVADOR', dataInicioVigencia: '2026-01-01' }],
      },
    });

    vi.mocked(ridesApi.getById).mockResolvedValue({
      response: {
        id: 101,
        status: 'PENDENTE',
        solicitanteId: 99,
        solicitanteNome: 'Outro Solicitante',
        dataCorrida: '2026-10-20T10:00:00Z',
        origem: { logradouro: 'Rua A', numero: '100' },
        destino: { logradouro: 'Rua B', numero: '200' },
        centrosCusto: [
          { centroCustoId: 1, centroCustoNome: 'Operações (Principal)', aprovadorId: 10 },
          { centroCustoId: 2, centroCustoNome: 'Marketing (Rateio)', aprovadorId: 20 },
        ],
      },
    } as any);

    vi.mocked(ridesApi.aprovar).mockResolvedValue({ response: { id: 101, status: 'APROVADA' } } as any);

    render(<RideReview />);

    await waitFor(() => expect(ridesApi.getById).toHaveBeenCalledWith(101));

    expect(screen.getByRole('heading', { name: 'Informações da corrida' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /próximo/i }));

    expect(screen.queryByText('Viação Alpha')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Revisar tudo' })).toBeInTheDocument());

    const approveBtn = screen.getByRole('button', { name: /aprovar solicitação/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {

      expect(ridesApi.aprovar).toHaveBeenCalledWith(101, undefined);
      expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    });
  });

  it('does not arbitrarily block self-approval if user is the requester and has approver rights', async () => {

    useAuthStore.setState({
      user: {
        id: '10',
        name: 'Solicitante e Aprovador',
        email: 'solicitante@empresa.com',
        profile: 'aprovador',
        perfis: [{ tipoPerfil: 'APROVADOR', dataInicioVigencia: '2026-01-01' }],
      },
    });

    vi.mocked(ridesApi.getById).mockResolvedValue({
      response: {
        id: 101,
        status: 'PENDENTE',
        solicitanteId: 10,
        solicitanteNome: 'Solicitante e Aprovador',
        dataCorrida: '2026-10-20T10:00:00Z',
        origem: { logradouro: 'Rua A', numero: '100' },
        destino: { logradouro: 'Rua B', numero: '200' },
        centrosCusto: [{ centroCustoId: 1, centroCustoNome: 'Operações' }],
      },
    } as any);

    render(<RideReview />);

    await waitFor(() => expect(ridesApi.getById).toHaveBeenCalledWith(101));

    expect(screen.getByRole('button', { name: /próximo/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /reprovar solicitação/i })).not.toBeDisabled();
  });
});
