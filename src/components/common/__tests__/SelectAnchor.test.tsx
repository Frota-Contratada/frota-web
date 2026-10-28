import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select/Select';
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';

const opcoes = [{ label: 'ROLÂNDIA – AB. AVES', value: '30:704' }];

describe('lista dos selects', () => {
  it('abre junto do botão no Select', async () => {
    render(<Select label="Filial" value="" options={opcoes} onChange={vi.fn()} helperText="Ajuda longa" />);

    const botao = screen.getByRole('button', { name: /selecione/i });
    await userEvent.click(botao);

    expect(botao.parentElement).toContainElement(screen.getByRole('listbox'));
  });

  it('abre junto do botão no SearchableSelect', async () => {
    render(<SearchableSelect label="Filial" value="" options={opcoes} onChange={vi.fn()} helperText="Ajuda longa" />);

    const botao = screen.getByRole('button', { name: /selecione/i });
    await userEvent.click(botao);

    expect(botao.parentElement).toContainElement(screen.getByRole('listbox'));
    expect(botao.parentElement).not.toContainElement(screen.getByText('Ajuda longa'));
  });
});
