import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { startSmartPolling } from '@/lib/smartPolling';
import { tocarSomNovoPedido } from '@/lib/notificationSound';
import {
  isRealtimeConnected,
  subscribeRealtime,
  subscribeRealtimeState,
} from '@/lib/realtime';

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  categoria_id?: string;
  url_imagem?: string;
  disponivel: boolean;
  tempo_preparo?: number;
}

export interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_id?: string;
  nome_cliente?: string;
  telefone_cliente?: string;
  valor_total: number;
  taxa_entrega: number;
  desconto?: number;
  forma_pagamento?: string;
  status_pagamento?: string;
  status: string;
  funcionario_id?: string;
  entregador_id?: string;
  tempo_preparo?: number;
  criado_em: string;
  atualizado_em: string;
  pronto_em?: string;
  entregue_em?: string;
  tipo_cliente?: string;
  endereco_entrega: string;
  observacoes?: string;
  perfis?: {
    nome_completo: string;
    telefone?: string;
  };
  entregador?: {
    nome_completo: string;
    telefone?: string;
  };
  itens_pedido: Array<{
    id: string;
    quantidade: number;
    preco_unitario: number;
    preco_adicionais?: number;
    preco_total: number;
    observacoes?: string;
    produto_nome?: string;
    variacao_nome?: string | null;
    tipo_variacao?: string | null;
    selecoes?: Array<{
      id?: string;
      nome?: string;
      categoria?: string;
      quantidade?: number;
      preco_adicional?: number;
    }> | string | null;
  }>;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  criado_em: string;
}

let notificationsStore: Notificacao[] = [];
const notificationListeners: Array<(n: Notificacao[]) => void> = [];
const notifiedOrderIds = new Set<string>();

const notifyListeners = () => {
  notificationListeners.forEach(cb => {
    try { cb(notificationsStore); } catch (e) { /* ignore */ }
  });
};

export const emitNotification = (n: Notificacao) => {
  notificationsStore = [n, ...notificationsStore];
  notifyListeners();
};

export const subscribeNotifications = (cb: (n: Notificacao[]) => void) => {
  notificationListeners.push(cb);
  try { cb(notificationsStore); } catch (e) { /* ignore */ }
  return () => {
    const idx = notificationListeners.indexOf(cb);
    if (idx !== -1) notificationListeners.splice(idx, 1);
  };
};

export const markNotificationRead = (id: string) => {
  const idx = notificationsStore.findIndex(n => n.id === id);
  if (idx !== -1) {
    notificationsStore[idx] = { ...notificationsStore[idx], lida: true };
    notifyListeners();
    return true;
  }
  return false;
};

export const useProdutos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const data = await apiRequest('/produtos?disponivel=true');
        setProdutos(data || []);
      } catch (err) { console.error('Erro ao buscar produtos:', err); setProdutos([]); }
      finally { setLoading(false); }
    };
    void fetchProdutos();
    return subscribeRealtime('delivery.catalog.updated', () => {
      void fetchProdutos();
    });
  }, []);

  return { produtos, loading };
};

export const useProdutoOpcoes = (produtoId: string) => {
  const [hasOptions, setHasOptions] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const data = await apiRequest(`/produtos/${produtoId}/opcoes`);
        setHasOptions((data || []).length > 0);
      } catch (err) { setHasOptions(false); }
      finally { setLoading(false); }
    };
    if (produtoId) check(); else setLoading(false);
  }, [produtoId]);

  return { hasOptions, loading };
};

const normalizarPedido = (pedido: unknown): Pedido => {
  const p = (typeof pedido === 'object' && pedido !== null)
    ? (pedido as Partial<Pedido>)
    : {} as Partial<Pedido>;
  const numero_pedido = p.numero_pedido || `KMK${String(p.id || '').slice(-6)}`;
  const itens_raw = (p.itens_pedido || []) as unknown[];
  const itens_pedido = itens_raw.map((item: unknown) => {
    const it = (typeof item === 'object' && item !== null)
      ? (item as { produto_nome?: string; observacoes?: string })
      : {};
    let produto_nome = it.produto_nome;
    if (!produto_nome && typeof it.observacoes === 'string' && it.observacoes) {
      try {
        const parsed = JSON.parse(it.observacoes);
        produto_nome = parsed && parsed.nome ? parsed.nome : undefined;
      } catch {
        // Observações em texto livre continuam válidas.
      }
    }
    return {
      ...(typeof item === 'object' && item !== null ? item as object : {}),
      produto_nome: produto_nome || 'Produto',
    };
  });

  return {
    ...(p as object),
    numero_pedido,
    perfis: p.perfis || undefined,
    entregador: p.entregador || undefined,
    itens_pedido,
  } as Pedido;
};

const ordenarPedidosRecentes = (pedidos: Pedido[]) => pedidos.sort((a, b) => {
  const dataA = new Date(a.criado_em).getTime();
  const dataB = new Date(b.criado_em).getTime();
  if (Number.isFinite(dataA) && Number.isFinite(dataB) && dataA !== dataB) {
    return dataB - dataA;
  }
  return String(b.numero_pedido || b.id).localeCompare(
    String(a.numero_pedido || a.id),
    'pt-BR',
    { numeric: true },
  );
});

export const usePedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const { user } = useAuth();
  const prevSeenIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);
  const prevStatusRef = useRef<Map<string,string>>(new Map());

  const fetchPedidos = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiRequest('/pedidos');
      {
        let pedidosFormatted = (data || []).map(normalizarPedido);

        if (user.tipo_usuario === 'cliente') pedidosFormatted = pedidosFormatted.filter(p => p.cliente_id === user.id);
        ordenarPedidosRecentes(pedidosFormatted);

        const currentIds = new Set<string>(pedidosFormatted.map(p => String(p.id)));
        if (firstLoadRef.current) {
          prevSeenIdsRef.current = new Set(Array.from(currentIds) as string[]);
          prevStatusRef.current = new Map(pedidosFormatted.map(p => [String(p.id), p.status]));
          firstLoadRef.current = false;
          setNewOrdersCount(0);
        } else {
          const newIds = Array.from(currentIds).filter(id => !prevSeenIdsRef.current.has(id));
          setNewOrdersCount(newIds.length);
          const newlyNotified = newIds.filter(id => !notifiedOrderIds.has(id));
          if (
            newlyNotified.length > 0
            && ['gerente', 'funcionario'].includes(user.tipo_usuario)
          ) {
            tocarSomNovoPedido();
          }
          newlyNotified.forEach(id => {
            const pedidoObj = pedidosFormatted.find(p => p.id === id);
            const titulo = 'Novo pedido';
            const mensagem = pedidoObj ? `Pedido #${pedidoObj.numero_pedido || id}` : `Novo pedido: ${id}`;
            emitNotification({ id: `order-${id}`, titulo, mensagem, tipo: 'pedido', lida: false, criado_em: new Date().toISOString() });
            notifiedOrderIds.add(id);
          });

          const statusChanges: Array<{id:string, oldStatus:string, newStatus:string}> = [];
          pedidosFormatted.forEach(p => { const prev = prevStatusRef.current.get(p.id); if (prev && prev !== p.status) statusChanges.push({ id: p.id, oldStatus: prev, newStatus: p.status }); });
          if (statusChanges.length > 0 && user && user.tipo_usuario === 'cliente') {
            statusChanges.forEach(sc => {
              const pedidoObj = pedidosFormatted.find(p => p.id === sc.id);
              const titulo = 'Atualização do pedido';
              const mensagem = pedidoObj ? `Seu pedido #${pedidoObj.numero_pedido || sc.id} passou para '${sc.newStatus}'.` : `Pedido ${sc.id} mudou para '${sc.newStatus}'.`;
              emitNotification({ id: `order-status-${sc.id}-${sc.newStatus}`, titulo, mensagem, tipo: 'pedido', lida: false, criado_em: new Date().toISOString() });
            });
          }

          prevStatusRef.current = new Map(pedidosFormatted.map(p => [p.id, p.status]));
        }

        setPedidos(pedidosFormatted);
      }
    } catch (err) { console.error('Erro geral ao buscar pedidos:', err); setPedidos([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    void fetchPedidos();
    const unsubscribeEvent = subscribeRealtime('delivery.orders.updated', () => {
      void fetchPedidos();
    });
    const unsubscribeState = subscribeRealtimeState((online) => {
      if (online) void fetchPedidos();
    });
    const stopFallback = startSmartPolling(() => (
      isRealtimeConnected() ? undefined : fetchPedidos()
    ), {
      activeInterval: 30_000,
      hiddenInterval: 2 * 60_000,
      maxInterval: 5 * 60_000,
    });

    return () => {
      unsubscribeEvent();
      unsubscribeState();
      stopFallback();
    };
  }, [fetchPedidos, user]);

  const markOrdersSeen = () => { prevSeenIdsRef.current = new Set(pedidos.map(p => p.id)); setNewOrdersCount(0); };
  const refreshPedidos = async () => {
    setRefreshing(true);
    try {
      await fetchPedidos();
    } finally {
      setRefreshing(false);
    }
  };

  const atualizarStatusPedido = async (pedidoId: string, novoStatus: string) => {
    try {
      await apiRequest(`/pedidos/${pedidoId}/status`, { method: 'PATCH', body: JSON.stringify({ status: novoStatus }) });
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
      return true;
    } catch (err) { console.error('Erro ao atualizar status do pedido:', err); return false; }
  };

  return {
    pedidos,
    loading,
    refreshing,
    atualizarStatusPedido,
    newOrdersCount,
    markOrdersSeen,
    refreshPedidos,
  };
};

type EscopoPedidos = 'hoje' | 'historico';

interface PaginaPedidos {
  pedidos?: unknown[];
  proximo_cursor?: string | null;
  tem_mais?: boolean;
}

export const usePedidosPaginados = (
  escopo: EscopoPedidos,
  dataHistorico: string | null = null,
) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const { user } = useAuth();
  const requestIdRef = useRef(0);
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const loadedOnceRef = useRef(false);

  const carregar = useCallback(async (reiniciar: boolean) => {
    if (!user || (!reiniciar && (!cursorRef.current || loadingMoreRef.current))) return;
    const requestId = ++requestIdRef.current;
    if (reiniciar) {
      if (!loadedOnceRef.current) setLoading(true);
    } else {
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }
    try {
      const params = new URLSearchParams({
        paginado: '1',
        escopo,
        limite: '20',
      });
      if (!reiniciar && cursorRef.current) params.set('cursor', cursorRef.current);
      if (escopo === 'historico' && dataHistorico) params.set('data', dataHistorico);
      const resposta = await apiRequest(`/pedidos?${params.toString()}`) as PaginaPedidos;
      if (requestId !== requestIdRef.current) return;
      const pagina = Array.isArray(resposta?.pedidos)
        ? resposta.pedidos.map(normalizarPedido)
        : [];
      setPedidos((atuais) => {
        const combinados = reiniciar ? pagina : [...atuais, ...pagina];
        return ordenarPedidosRecentes(Array.from(
          new Map(combinados.map((pedido) => [pedido.id, pedido])).values(),
        ));
      });
      cursorRef.current = typeof resposta?.proximo_cursor === 'string'
        ? resposta.proximo_cursor
        : null;
      setHasMore(resposta?.tem_mais === true);
      loadedOnceRef.current = true;
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [dataHistorico, escopo, user]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    cursorRef.current = null;
    try {
      await carregar(true);
    } finally {
      setRefreshing(false);
    }
  }, [carregar]);

  useEffect(() => {
    setPedidos([]);
    cursorRef.current = null;
    loadedOnceRef.current = false;
    setHasMore(false);
    void carregar(true);
  // A alteração do cursor não deve reiniciar a página.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, escopo, dataHistorico]);

  useEffect(() => {
    if (escopo !== 'hoje') return undefined;
    const unsubscribeEvent = subscribeRealtime('delivery.orders.updated', () => {
      setCursor(null);
      void carregar(true);
    });
    const unsubscribeState = subscribeRealtimeState((online) => {
      if (online) void carregar(true);
    });
    return () => {
      unsubscribeEvent();
      unsubscribeState();
    };
  }, [carregar, escopo]);

  const atualizarStatusPedido = async (pedidoId: string, novoStatus: string) => {
    try {
      await apiRequest(`/pedidos/${pedidoId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: novoStatus }),
      });
      setPedidos((atuais) => atuais.map((pedido) => (
        pedido.id === pedidoId ? { ...pedido, status: novoStatus } : pedido
      )));
      return true;
    } catch {
      return false;
    }
  };

  return {
    pedidos,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    loadMore: () => carregar(false),
    refreshPedidos: refresh,
    atualizarStatusPedido,
  };
};

export const useNotificacoes = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchNotificacoes = async () => {
      try {
        const data = await apiRequest('/notificacoes');
        setNotificacoes(Array.isArray(data) ? data.map((item) => ({
          ...item,
          id: String(item.id ?? item.uuid),
        })) : []);
      } finally {
        setLoading(false);
      }
    };
    void fetchNotificacoes();
    const unsubscribeEvent = subscribeRealtime('delivery.notifications.updated', () => {
      void fetchNotificacoes();
    });
    const unsubscribeState = subscribeRealtimeState((online) => {
      if (online) void fetchNotificacoes();
    });
    const stopFallback = startSmartPolling(() => (
      isRealtimeConnected() ? undefined : fetchNotificacoes()
    ), {
      activeInterval: 45_000,
      hiddenInterval: 2 * 60_000,
    });

    return () => {
      unsubscribeEvent();
      unsubscribeState();
      stopFallback();
    };
  }, [user]);

  const marcarComoLida = async (notificacaoId: string) => {
    try {
      await apiRequest(`/notificacoes/${notificacaoId}/lida`, {
        method: 'PATCH',
        body: '{}',
      });
      setNotificacoes((atuais) => atuais.map((item) => (
        item.id === notificacaoId ? { ...item, lida: true } : item
      )));
      return true;
    } catch {
      return false;
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      await apiRequest('/notificacoes/lidas', {
        method: 'PATCH',
        body: '{}',
      });
      setNotificacoes((atuais) => atuais.map((item) => ({ ...item, lida: true })));
      return true;
    } catch {
      return false;
    }
  };

  const excluirNotificacao = async (notificacaoId: string) => {
    try {
      await apiRequest(`/notificacoes/${notificacaoId}`, { method: 'DELETE' });
      setNotificacoes((atuais) => atuais.filter((item) => item.id !== notificacaoId));
      return true;
    } catch {
      return false;
    }
  };

  const limparNotificacoes = async () => {
    try {
      await apiRequest('/notificacoes', { method: 'DELETE' });
      setNotificacoes([]);
      return true;
    } catch {
      return false;
    }
  };

  return {
    notificacoes,
    loading,
    marcarComoLida,
    marcarTodasComoLidas,
    excluirNotificacao,
    limparNotificacoes,
  };
};
