import { describe, expect, it } from 'vitest';
import { formatDocument } from './SuppliersList';

describe('supplier document display', () => {
  it('keeps corporate suppliers without CNPJ/CPF readable', () => {
    expect(formatDocument(null)).toBe('Não informado');
    expect(formatDocument('')).toBe('Não informado');
    expect(formatDocument('12345678000195')).toBe('12.345.678/0001-95');
  });
});
