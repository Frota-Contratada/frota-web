import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterDropdown } from '../FilterDropdown/FilterDropdown';

const filiais = Array.from({ length: 12 }, (_, index) => ({
  label: index === 7 ? 'ROLÂNDIA – AB. AVES' : `FILIAL ${index}`,
  value: `filial:${index}`,
}));

describe('FilterDropdown com muitas opções', () => {
  it('mostra busca na seção longa e mantém os marcados visíveis', async () => {
    render(
      <FilterDropdown
        sections={[{ title: 'Filial', options: filiais }]}
        selectedValues={['filial:2']}
        onChange={vi.fn()}
        trigger={<span>Filtrar</span>}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar filial' }), 'rolandia');

    expect(screen.getByText('ROLÂNDIA – AB. AVES')).toBeInTheDocument();
    expect(screen.getByText('FILIAL 2')).toBeInTheDocument();
    expect(screen.queryByText('FILIAL 3')).not.toBeInTheDocument();
  });

  it('não mostra busca em seções curtas', async () => {
    render(
      <FilterDropdown
        sections={[{ title: 'Status', options: filiais.slice(0, 3) }]}
        selectedValues={[]}
        onChange={vi.fn()}
        trigger={<span>Filtrar</span>}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});
