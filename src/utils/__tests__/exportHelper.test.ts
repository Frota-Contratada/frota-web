import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCsv, exportToPdf, type ExportColumn } from '../exportHelper';

describe('exportHelper - Exportação em Formato Aberto e PDF (Tasks 5101, 5093, 4669, 4278)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportToCsv', () => {
    it('generates a CSV download blob with BOM and escaped headers and rows', () => {
      const data = [
        { id: 101, fornecedor: 'Aurora Transportes', valor: 350.5, status: 'Finalizada' },
        { id: 102, fornecedor: 'Rota Certa', valor: 120.0, status: 'Pendente' },
      ];

      const columns: ExportColumn<typeof data[0]>[] = [
        { key: 'id', label: 'Código' },
        { key: 'fornecedor', label: 'Fornecedor' },
        {
          key: 'valor',
          label: 'Valor (R$)',
          format: (val) => Number(val).toFixed(2).replace('.', ','),
        },
        { key: 'status', label: 'Status' },
      ];

      const clickSpy = vi.fn();
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
      const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/test');
      const revokeObjectURLMock = vi.fn();

      window.URL.createObjectURL = createObjectURLMock;
      window.URL.revokeObjectURL = revokeObjectURLMock;

      vi.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: vi.fn(),
        click: clickSpy,
      } as any);

      const success = exportToCsv('fechamento-agosto', data, columns);

      expect(success).toBe(true);
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
    });

    it('returns false gracefully when data is empty', () => {
      const success = exportToCsv('vazio', [], [{ key: 'id', label: 'ID' }]);
      expect(success).toBe(false);
    });
  });

  describe('exportToPdf', () => {
    it('creates a print-friendly document window with report tables and calls print', () => {
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
      };

      vi.spyOn(window, 'open').mockReturnValue(mockPrintWindow as any);

      const success = exportToPdf({
        title: 'Relatório de Fechamento Financeiro',
        subtitle: 'Filial Londrina - Período Agosto/2026',
        dataSummary: {
          'Total de Corridas': 45,
          'KM Percorrido': '1.240 km',
          'Valor Total': 'R$ 18.520,00',
        },
        tableHeaders: ['ID', 'Data', 'Fornecedor', 'Valor'],
        tableRows: [
          [1, '15/08/2026', 'Aurora Transportes', 'R$ 150,00'],
          [2, '18/08/2026', 'Rota Certa', 'R$ 220,00'],
        ],
      });

      expect(success).toBe(true);
      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(mockPrintWindow.document.write).toHaveBeenCalled();
      expect(mockPrintWindow.document.close).toHaveBeenCalled();
      expect(mockPrintWindow.focus).toHaveBeenCalled();
    });

    it('falls back to window.print if popup is blocked', () => {
      vi.spyOn(window, 'open').mockReturnValue(null);
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      const success = exportToPdf({
        title: 'Relatório Simples',
      });

      expect(success).toBe(true);
      expect(printSpy).toHaveBeenCalled();
    });
  });
});
