export interface EnderecoCep {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const cache = new Map<string, EnderecoCep>();

export const formatarCep = (valor: string): string => {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  return digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos;
};

export const buscarEnderecoPorCep = async (
  valor: string,
): Promise<EnderecoCep | null> => {
  const cep = valor.replace(/\D/g, '');
  if (cep.length !== 8) return null;

  const armazenado = cache.get(cep);
  if (armazenado) return armazenado;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Não foi possível consultar o CEP.');

    const dados = await response.json();
    if (dados.erro) return null;

    const endereco: EnderecoCep = {
      cep: formatarCep(dados.cep || cep),
      logradouro: String(dados.logradouro || '').trim(),
      complemento: String(dados.complemento || '').trim(),
      bairro: String(dados.bairro || '').trim(),
      cidade: String(dados.localidade || '').trim(),
      estado: String(dados.uf || '').trim().toUpperCase(),
    };
    cache.set(cep, endereco);
    return endereco;
  } finally {
    window.clearTimeout(timeout);
  }
};
