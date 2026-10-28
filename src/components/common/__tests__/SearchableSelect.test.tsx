import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';

const filiais = [
  { label: 'ARAPONGAS – AB. AVES', value: '30:701', searchText: '701' },
  { label: 'ROLÂNDIA – AB. AVES', value: '30:704', searchText: '704 00000000000191' },
  { label: 'TOLEDO – SUÍNOS', value: '30:720', searchText: '720' },
];

describe('SearchableSelect', () => {
  it('filtra sem acento nem maiúscula e seleciona', async () => {
    const onChange = vi.fn();
    render(<SearchableSelect label="Filial" value="" options={filiais} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /selecione/i }));
    await userEvent.type(screen.getByRole('combobox'), 'rolandia');

    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.click(screen.getByRole('option', { name: /ROLÂNDIA/ }));
    expect(onChange).toHaveBeenCalledWith('30:704');
  });

  it('acha pelo texto extra, como código ou CNPJ', async () => {
    render(<SearchableSelect label="Filial" value="" options={filiais} onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /selecione/i }));
    await userEvent.type(screen.getByRole('combobox'), '0000191');

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['ROLÂNDIA – AB. AVES']);
  });

  it('seleciona pelo teclado', async () => {
    const onChange = vi.fn();
    render(<SearchableSelect label="Filial" value="" options={filiais} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /selecione/i }));
    await userEvent.type(screen.getByRole('combobox'), 'aves{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('30:704');
  });

  it('busca no servidor só a partir do mínimo de letras, com atraso', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onSearch = vi.fn();
    render(
      <SearchableSelect label="Fornecedor" value="" options={[]} onChange={vi.fn()} onSearch={onSearch} minSearchLength={3} />
    );

    await userEvent.click(screen.getByRole('button', { name: /selecione/i }));
    expect(screen.getByText('Digite ao menos 3 letras para buscar')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('combobox'), 'ita');
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('ita');
    vi.useRealTimers();
  });

  it('mostra o label do valor escolhido mesmo fora das opções atuais', () => {
    render(
      <SearchableSelect
        label="Fornecedor"
        value="864"
        options={[]}
        onChange={vi.fn()}
        onSearch={vi.fn()}
        selectedLabel="ITALIANINHA TRANSPORTES"
      />
    );

    expect(screen.getByRole('button', { name: 'ITALIANINHA TRANSPORTES' })).toBeInTheDocument();
  });
});
