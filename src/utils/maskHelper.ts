/**
 * Utilitários centralizados para máscaras, validações e formatações de dados.
 * Suporta novo padrão alfanumérico para CPF e CNPJ.
 */

// ==========================================
// CPF (suporta alfanumérico: letras A-Z e números 0-9)
// ==========================================
export const cleanCpf = (cpf: string | null | undefined): string => {
  if (!cpf) return '';
  return cpf.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11);
};

export const formatCpf = (cpf: string | null | undefined, fallback = ''): string => {
  if (!cpf) return fallback;
  const raw = cleanCpf(cpf);
  if (!raw) return fallback;

  if (raw.length > 9) {
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
  }
  if (raw.length > 6) {
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
  }
  if (raw.length > 3) {
    return `${raw.slice(0, 3)}.${raw.slice(3)}`;
  }
  return raw;
};

export const isValidCpf = (cpf: string | null | undefined): boolean => {
  const raw = cleanCpf(cpf);
  return raw.length === 11;
};

// ==========================================
// CNPJ (suporta alfanumérico: letras A-Z e números 0-9)
// ==========================================
export const cleanCnpj = (cnpj: string | null | undefined): string => {
  if (!cnpj) return '';
  return cnpj.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 14);
};

export const formatCnpj = (cnpj: string | null | undefined, fallback = ''): string => {
  if (!cnpj) return fallback;
  const raw = cleanCnpj(cnpj);
  if (!raw) return fallback;

  if (raw.length > 12) {
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
  }
  if (raw.length > 8) {
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
  }
  if (raw.length > 5) {
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
  }
  if (raw.length > 2) {
    return `${raw.slice(0, 2)}.${raw.slice(2)}`;
  }
  return raw;
};

export const isValidCnpj = (cnpj: string | null | undefined): boolean => {
  const raw = cleanCnpj(cnpj);
  return raw.length === 14;
};

// ==========================================
// CEP (8 dígitos numéricos)
// ==========================================
export const cleanCep = (cep: string | null | undefined): string => {
  if (!cep) return '';
  return cep.replace(/\D/g, '').slice(0, 8);
};

export const formatCep = (cep: string | null | undefined, fallback = ''): string => {
  if (!cep) return fallback;
  const raw = cleanCep(cep);
  if (!raw) return fallback;

  if (raw.length > 5) {
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  }
  return raw;
};

export const isValidCep = (cep: string | null | undefined): boolean => {
  const raw = cleanCep(cep);
  return raw.length === 8;
};

// ==========================================
// Telefone / Celular (10 ou 11 dígitos numéricos)
// ==========================================
export const cleanPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(0, 11);
};

export const formatPhone = (phone: string | null | undefined, fallback = ''): string => {
  if (!phone) return fallback;
  const raw = cleanPhone(phone);
  if (!raw) return fallback;

  if (raw.length > 10) {
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  }
  if (raw.length > 6) {
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
  }
  if (raw.length > 2) {
    return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
  }
  return `(${raw}`;
};

export const isValidPhone = (phone: string | null | undefined): boolean => {
  const raw = cleanPhone(phone);
  return raw.length === 10 || raw.length === 11;
};
