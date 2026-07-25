import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { startSmartPolling } from '@/lib/smartPolling';

export interface ConfiguracaoEstabelecimento {
  id: string;
  nome_plataforma?: string;
  cnpj?: string;
  descricao_plataforma?: string;
  url_icone_plataforma?: string;
  url_capa_plataforma?: string;
  url_frontend?: string;
  slogan_plataforma?: string;
  categoria_estabelecimento?: string;
  texto_chamada_endereco?: string;
  whatsapp?: string;
  instagram?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  cor_navbar?: string;
  cor_footer?: string;
  cor_section_header?: string;
  cor_section_produtos?: string;
  cor_section_comprar?: string;
  cor_section_contato?: string;
  cor_botoes?: string;
  cor_icones?: string;
  taxa_entrega: number;
  valor_minimo_frete_gratis: number;
  localidades_frete_gratis?: string[];
  entrega_restrita?: boolean | number | string;
  areas_entrega?: Array<{
    cidade: string;
    estado: string;
    localidades: string[];
  }>;
  chave_pix?: string;
  nome_recebedor_pix?: string;
  cidade_recebedor_pix?: string;
  cep_recebedor_pix?: string;
  mensagem_pix?: string;
  criado_em: string;
  atualizado_em: string;
  esta_aberto?: boolean | number | string;
  aberto?: boolean | number | string;
  hora_abertura?: string;
  hora_fechamento?: string;
  endereco_estabelecimento?: string;
  bairro_estabelecimento?: string;
  cidade_estabelecimento?: string;
  estado_estabelecimento?: string;
  cep_estabelecimento?: string;
  aberto_segunda?: boolean;
  hora_abertura_segunda?: string;
  hora_fechamento_segunda?: string;
  aberto_terca?: boolean;
  hora_abertura_terca?: string;
  hora_fechamento_terca?: string;
  aberto_quarta?: boolean;
  hora_abertura_quarta?: string;
  hora_fechamento_quarta?: string;
  aberto_quinta?: boolean;
  hora_abertura_quinta?: string;
  hora_fechamento_quinta?: string;
  aberto_sexta?: boolean;
  hora_abertura_sexta?: string;
  hora_fechamento_sexta?: string;
  aberto_sabado?: boolean;
  hora_abertura_sabado?: string;
  hora_fechamento_sabado?: string;
  aberto_domingo?: boolean;
  hora_abertura_domingo?: string;
  hora_fechamento_domingo?: string;
}

const STORAGE_KEY = 'estabelecimentoConfig';

const carregarConfiguracaoLocal = (): ConfiguracaoEstabelecimento | null => {
  try {
    const valor = localStorage.getItem(STORAGE_KEY);
    return valor ? JSON.parse(valor) as ConfiguracaoEstabelecimento : null;
  } catch {
    return null;
  }
};

const valorBooleano = (valor: unknown): boolean => (
  valor === true
  || valor === 1
  || (typeof valor === 'string' && ['1', 'true', 'sim'].includes(valor.trim().toLowerCase()))
);

const horaEmMinutos = (hora: string): number | null => {
  const correspondencia = /^([01]\d|2[0-3]):([0-5]\d)/.exec(hora.trim());
  if (!correspondencia) return null;
  return Number(correspondencia[1]) * 60 + Number(correspondencia[2]);
};

const calcularAberto = (config: ConfiguracaoEstabelecimento | null): boolean => {
  if (!config || !valorBooleano(config.aberto)) return false;
  if (config.esta_aberto !== undefined) return valorBooleano(config.esta_aberto);

  const abertura = horaEmMinutos(config.hora_abertura ?? '');
  const fechamento = horaEmMinutos(config.hora_fechamento ?? '');
  if (abertura === null || fechamento === null || abertura === fechamento) return false;

  const agora = new Date();
  const atual = agora.getHours() * 60 + agora.getMinutes();

  return abertura < fechamento
    ? atual >= abertura && atual < fechamento
    : atual >= abertura || atual < fechamento;
};

const updateMetaTags = (config: ConfiguracaoEstabelecimento): void => {
  if (config.nome_plataforma) {
    document.title = config.nome_plataforma;
    document.querySelector('meta[property="og:title"]')
      ?.setAttribute('content', config.nome_plataforma);
  }

  const faviconAtual = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!config.url_icone_plataforma) {
    faviconAtual?.remove();
    return;
  }

  const favicon = faviconAtual ?? document.createElement('link');
  favicon.rel = 'icon';
  favicon.href = config.url_icone_plataforma;
  if (!faviconAtual) document.head.appendChild(favicon);
};

let configuracaoCompartilhada = carregarConfiguracaoLocal();
let requisicaoAtual: Promise<void> | null = null;
let pararPolling: (() => void) | null = null;
const assinantes = new Set<(config: ConfiguracaoEstabelecimento) => void>();

const publicarConfiguracao = (config: ConfiguracaoEstabelecimento): void => {
  configuracaoCompartilhada = config;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  updateMetaTags(config);
  assinantes.forEach((assinante) => assinante(config));
};

const buscarConfiguracaoCompartilhada = (): Promise<void> => {
  if (requisicaoAtual) return requisicaoAtual;
  requisicaoAtual = (async () => {
    const data = await apiRequest('/configuracao', {
      cache: 'no-store',
    }) as ConfiguracaoEstabelecimento;
    publicarConfiguracao(data);
  })().finally(() => {
    requisicaoAtual = null;
  });

  return requisicaoAtual;
};

export const useEstabelecimento = () => {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoEstabelecimento | null>(
    configuracaoCompartilhada,
  );
  const [loading, setLoading] = useState(configuracaoCompartilhada === null);
  const { user } = useAuth();

  const fetchConfiguracao = async (): Promise<void> => {
    try {
      await buscarConfiguracaoCompartilhada();
    } catch {
      if (!configuracaoCompartilhada) {
        const local = carregarConfiguracaoLocal();
        if (local) publicarConfiguracao(local);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const atualizar = (config: ConfiguracaoEstabelecimento) => {
      setConfiguracao(config);
      setLoading(false);
    };
    assinantes.add(atualizar);
    void fetchConfiguracao();
    if (!pararPolling) {
      pararPolling = startSmartPolling(buscarConfiguracaoCompartilhada, {
        activeInterval: 5_000,
        hiddenInterval: 30_000,
        maxInterval: 2 * 60_000,
      });
    }

    return () => {
      assinantes.delete(atualizar);
      if (assinantes.size === 0 && pararPolling) {
        pararPolling();
        pararPolling = null;
      }
    };
  }, []);

  const atualizarConfiguracao = async (
    dados: Partial<ConfiguracaoEstabelecimento>,
  ): Promise<boolean> => {
    if (user?.tipo_usuario !== 'gerente') {
      throw new Error('Apenas gerentes podem atualizar configurações');
    }

    try {
      const resposta = await apiRequest('/configuracao', {
        method: 'PATCH',
        body: JSON.stringify(dados),
      }) as Partial<ConfiguracaoEstabelecimento> | null;
      const atualizada = {
        ...configuracaoCompartilhada,
        ...dados,
        ...(resposta ?? {}),
      } as ConfiguracaoEstabelecimento;
      publicarConfiguracao(atualizada);
      return true;
    } catch (error) {
      throw error;
    }
  };

  return {
    configuracao,
    loading,
    estaAberto: calcularAberto(configuracao),
    atualizarConfiguracao,
    refetch: fetchConfiguracao,
  };
};
