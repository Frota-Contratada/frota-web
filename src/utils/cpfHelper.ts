export const formatCpf = (cpf: string | null): string => {
  if (!cpf) return 'Não informado';

  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) {
    return cpf;
  }

  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
};
