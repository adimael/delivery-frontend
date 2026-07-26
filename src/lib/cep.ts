export interface EnderecoCep {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const cache = new Map<string, EnderecoCep>();
const TEMPO_LIMITE_MS = 8000;

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

  const provedores = [
    {
      url: `/cep/${cep}`,
      normalizar: (dados: any): EnderecoCep | null => dados?.erro ? null : ({
        cep: formatarCep(dados.cep || cep),
        logradouro: String(dados.logradouro || '').trim(),
        complemento: String(dados.complemento || '').trim(),
        bairro: String(dados.bairro || '').trim(),
        cidade: String(dados.localidade || '').trim(),
        estado: String(dados.uf || '').trim().toUpperCase(),
      }),
    },
    {
      url: `https://brasilapi.com.br/api/cep/v1/${cep}`,
      normalizar: (dados: any): EnderecoCep | null => !dados?.cep ? null : ({
        cep: formatarCep(dados.cep || cep),
        logradouro: String(dados.street || '').trim(),
        complemento: '',
        bairro: String(dados.neighborhood || '').trim(),
        cidade: String(dados.city || '').trim(),
        estado: String(dados.state || '').trim().toUpperCase(),
      }),
    },
    {
      url: `https://viacep.com.br/ws/${cep}/json/`,
      normalizar: (dados: any): EnderecoCep | null => dados?.erro ? null : ({
        cep: formatarCep(dados.cep || cep),
        logradouro: String(dados.logradouro || '').trim(),
        complemento: String(dados.complemento || '').trim(),
        bairro: String(dados.bairro || '').trim(),
        cidade: String(dados.localidade || '').trim(),
        estado: String(dados.uf || '').trim().toUpperCase(),
      }),
    },
  ];

  for (const provedor of provedores) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), TEMPO_LIMITE_MS);
    try {
      const response = await fetch(provedor.url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) continue;

      const endereco = provedor.normalizar(await response.json());
      if (endereco) {
        cache.set(cep, endereco);
        return endereco;
      }
      return null;
    } catch {
      // Tenta o próximo provedor automaticamente.
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw new Error('Nenhum serviço de CEP respondeu.');
};
