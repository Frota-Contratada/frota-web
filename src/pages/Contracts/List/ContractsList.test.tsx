import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContractsList } from './ContractsList';
import { contractApi } from '../../../services';
import { exportToCsv } from '../../../utils/exportHelper';

const showToast = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => ({
  ...await importOriginal<typeof import('react-router-dom')>(),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../components/common', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  Input: () => <input />,
  StatCard: () => null,
  StatusBadge: () => null,
  Table: () => null,
  TableToolbar: ({ onExport }: { onExport: () => void }) => <button onClick={onExport}>Exportar contratos</button>,
  useToast: () => ({ showToast }),
}));

vi.mock('../../../services', () => ({
  contractApi: { list: vi.fn(), getAdminBigNumbers: vi.fn() },
  contractIaApi: { extrairDados: vi.fn() },
  extractListData: (response: { response: unknown[] }) => response.response,
}));

vi.mock('../../../utils/exportHelper', () => ({ exportToCsv: vi.fn() }));

describe('ContractsList export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractApi.list).mockResolvedValue({ response: [
      { id: 9001, status: 'ATIVO', dataVigenciaInicio: '2026-09-01',
        dataVigenciaFim: '2027-12-31', caminhoArquivo: 'contratos/fixture.pdf',
        vinculos: [{ fornecedorNome: 'Fornecedor fictício', filialNome: 'Filial fictícia' }] },
    ] } as Awaited<ReturnType<typeof contractApi.list>>);
    vi.mocked(contractApi.getAdminBigNumbers).mockResolvedValue({ response: { total: 1, validos: 1, vencemEmBreve: 0, vencidos: 0 } } as Awaited<ReturnType<typeof contractApi.getAdminBigNumbers>>);
    vi.mocked(exportToCsv).mockReturnValue(true);
  });

  it('downloads filtered contract rows rather than showing only a toast', async () => {
    render(<ContractsList />);
    await waitFor(() => expect(contractApi.list).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Exportar contratos' }));
    expect(exportToCsv).toHaveBeenCalledWith('contratos-frota',
      [expect.objectContaining({ id: 9001, fornecedor: 'Fornecedor fictício' })],
      expect.arrayContaining([expect.objectContaining({ key: 'codigo', label: 'Contrato' })]));
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Exportação concluída' }));
  });
});
