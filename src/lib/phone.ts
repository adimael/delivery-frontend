export const formatBrazilianPhone = (value?: string | null): string => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';

  const hasCountryCode = (digits.length === 12 || digits.length === 13)
    && digits.startsWith('55');
  const local = hasCountryCode ? digits.slice(2) : digits;
  const prefix = hasCountryCode ? '+55 ' : '';

  if (local.length === 11) {
    return `${prefix}(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `${prefix}(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }

  return String(value || '').trim();
};
