import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input/Input';

describe('Input component', () => {
  it('renders with label and placeholder', () => {
    render(<Input label="E-mail" placeholder="Digite seu e-mail" />);

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite seu e-mail')).toBeInTheDocument();
  });

  it('updates value on change', async () => {
    const handleChange = vi.fn();
    render(<Input label="Nome" onChange={handleChange} />);

    const input = screen.getByLabelText('Nome');
    await userEvent.type(input, 'Seara');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('Seara');
  });

  it('renders error message and applies error state', () => {
    render(<Input label="Senha" error="Senha obrigatória" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Senha obrigatória');
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true');
  });

  it('disables input when disabled prop is true', () => {
    render(<Input label="Desabilitado" disabled />);

    expect(screen.getByLabelText('Desabilitado')).toBeDisabled();
  });
});
