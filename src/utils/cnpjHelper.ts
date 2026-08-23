export const formatCnpj = (val: string): string => {
  const raw = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 14);
  let formatted = raw;
  if (raw.length > 12) {
    formatted = `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
  } else if (raw.length > 8) {
    formatted = `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
  } else if (raw.length > 5) {
    formatted = `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
  } else if (raw.length > 2) {
    formatted = `${raw.slice(0, 2)}.${raw.slice(2)}`;
  }
  return formatted;
};

export const cleanCnpj = (val: string): string => {
  return (val || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

export const isValidCnpj = (val: string): boolean => {
  const c = cleanCnpj(val);
  return c.length === 14;
};
