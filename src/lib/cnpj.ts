const valorCaractere = (caractere: string) => caractere.charCodeAt(0) - 48;

const digitoVerificador = (base: string, pesos: number[]) => {
  const soma = [...base].reduce(
    (total, caractere, indice) => total + valorCaractere(caractere) * pesos[indice],
    0,
  );
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
};

/** Valida o CNPJ numérico atual e o formato alfanumérico da Receita Federal. */
export const validarCnpj = (valor: string): boolean => {
  const cnpj = valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj)) return false;
  if (/^(\w)\1{13}$/.test(cnpj)) return false;

  const primeiro = digitoVerificador(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digitoVerificador(`${cnpj.slice(0, 12)}${primeiro}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${primeiro}${segundo}`);
};

export const formatarCnpj = (valor: string): string => {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
  return limpo
    .replace(/^(.{2})(.{1,3})/, '$1.$2')
    .replace(/^(.{2})\.(.{3})(.{1,3})/, '$1.$2.$3')
    .replace(/\.(.{3})(.{1,4})/, '.$1/$2')
    .replace(/(.{4})(.{1,2})$/, '$1-$2');
};
