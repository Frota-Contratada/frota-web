import { describe, it, expect } from 'vitest';
import {
  formatCpf,
  cleanCpf,
  isValidCpf,
  formatCnpj,
  cleanCnpj,
  isValidCnpj,
  formatCep,
  cleanCep,
  isValidCep,
  formatPhone,
  cleanPhone,
  isValidPhone,
} from '../maskHelper';

describe('maskHelper', () => {
  describe('CPF (com suporte a alfanumérico)', () => {
    it('formata CPF numérico tradicional', () => {
      expect(formatCpf('12345678901')).toBe('123.456.789-01');
    });

    it('formata CPF com caracteres alfanuméricos', () => {
      expect(formatCpf('abc12d34e5f')).toBe('ABC.12D.34E-5F');
    });

    it('limpa CPF mantendo alfanuméricos em caixa alta', () => {
      expect(cleanCpf('abc.12d.34e-5f')).toBe('ABC12D34E5F');
    });

    it('valida CPF alfanumérico com 11 dígitos/caracteres', () => {
      expect(isValidCpf('ABC.12D.34E-5F')).toBe(true);
      expect(isValidCpf('123.456.789-01')).toBe(true);
      expect(isValidCpf('123.456.789')).toBe(false);
    });

    it('formata progressivamente durante a digitação', () => {
      expect(formatCpf('12')).toBe('12');
      expect(formatCpf('1234')).toBe('123.4');
      expect(formatCpf('1234567')).toBe('123.456.7');
    });
  });

  describe('CNPJ (com suporte a alfanumérico)', () => {
    it('formata CNPJ alfanumérico', () => {
      expect(formatCnpj('12abc345000199')).toBe('12.ABC.345/0001-99');
    });

    it('limpa CNPJ mantendo alfanuméricos em caixa alta', () => {
      expect(cleanCnpj('12.ABC.345/0001-99')).toBe('12ABC345000199');
    });

    it('valida CNPJ alfanumérico de 14 caracteres', () => {
      expect(isValidCnpj('12.ABC.345/0001-99')).toBe(true);
      expect(isValidCnpj('12.ABC.345')).toBe(false);
    });
  });

  describe('CEP', () => {
    it('formata e limpa CEP de 8 dígitos', () => {
      expect(formatCep('01310100')).toBe('01310-100');
      expect(cleanCep('01310-100')).toBe('01310100');
      expect(isValidCep('01310-100')).toBe(true);
      expect(isValidCep('01310')).toBe(false);
    });
  });

  describe('Telefone / Celular', () => {
    it('formata telefone fixo (10 dígitos)', () => {
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
      expect(cleanPhone('(11) 3333-4444')).toBe('1133334444');
      expect(isValidPhone('1133334444')).toBe(true);
    });

    it('formata celular (11 dígitos)', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
      expect(cleanPhone('(11) 98765-4321')).toBe('11987654321');
      expect(isValidPhone('11987654321')).toBe(true);
    });
  });
});
