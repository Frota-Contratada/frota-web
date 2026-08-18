import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddressAutocomplete } from '../AddressAutocomplete';
import { geoService, type SugestaoEndereco } from '../../../services/maps/geoService';

const TestWrapper = ({ onSelectAddress }: { onSelectAddress?: (addr: SugestaoEndereco) => void }) => {
  const [val, setVal] = useState('');
  return (
    <AddressAutocomplete
      label="Destino"
      placeholder="Digite o destino"
      value={val}
      onChange={setVal}
      onSelectAddress={onSelectAddress}
    />
  );
};

describe('AddressAutocomplete component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders input with label and placeholder', () => {
    render(<TestWrapper />);

    expect(screen.getByLabelText('Destino')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite o destino')).toBeInTheDocument();
  });

  it('displays suggestions dropdown after debounced typing', async () => {
    const mockSuggestions = [
      {
        displayName: 'Seara Matriz, São Paulo - SP',
        latitude: -23.518,
        longitude: -46.745,
        logradouro: 'Av. Marginal',
        cidade: 'São Paulo',
      },
    ];

    vi.spyOn(geoService, 'buscarSugestoesEndereco').mockResolvedValue(mockSuggestions);
    const handleSelect = vi.fn();

    render(<TestWrapper onSelectAddress={handleSelect} />);

    await userEvent.type(screen.getByLabelText('Destino'), 'Seara');

    await waitFor(
      () => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(screen.getByText('Seara Matriz, São Paulo - SP')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Seara Matriz, São Paulo - SP'));
    expect(handleSelect).toHaveBeenCalledWith(mockSuggestions[0]);
  });
});
