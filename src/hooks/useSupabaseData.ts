import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { startSmartPolling } from '@/lib/smartPolling';
import { tocarSomNovoPedido } from '@/lib/notificationSound';
import { notificarNovoPedido } from '@/lib/orderNotifications';

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
    fetchProdutos();
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
        let pedidosFormatted = (data || []).map((pedido: unknown) => {
          const p = (typeof pedido === 'object' && pedido !== null) ? (pedido as Partial<Pedido>) : {} as Partial<Pedido>;
          const numero_pedido = p.numero_pedido || `KMK${(String(p.id || '')).slice(-6)}`;
          const perfis = p.perfis || undefined;
          const entregador = p.entregador || undefined;
          const itens_raw = (p.itens_pedido || []) as unknown[];
          const itens_pedido = itens_raw.map((item: unknown) => {
            const it = (typeof item === 'object' && item !== null) ? (item as { produto_nome?: string; observacoes?: string }) : {};
            let produto_nome = it.produto_nome as string | undefined;
            if (!produto_nome) {
              try {
                if (typeof it.observacoes === 'string' && it.observacoes) {
                  const parsed = JSON.parse(it.observacoes as string);
                  produto_nome = parsed && parsed.nome ? parsed.nome : undefined;
                }
              } catch (e) {
                // ignore parse errors
              }
            }
            return { ...(typeof item === 'object' && item !== null ? item as object : {}), produto_nome: produto_nome || 'Produto' };
          });

          return { ...(p as object), numero_pedido, perfis, entregador, itens_pedido } as Pedido;
        });

        if (user.tipo_usuario === 'cliente') pedidosFormatted = pedidosFormatted.filter(p => p.cliente_id === user.id);
        pedidosFormatted.sort((a, b) => {
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
            const pedidoNovo = pedidosFormatted.find(p => p.id === newlyNotified[0]);
            void notificarNovoPedido(
              newlyNotified.length,
              newlyNotified.length === 1 ? pedidoNovo?.numero_pedido : undefined,
            );
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
    fetchPedidos();
    return startSmartPolling(fetchPedidos, {
      activeInterval: 6_000,
      hiddenInterval: 30_000,
      maxInterval: 3 * 60_000,
    });
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
    return startSmartPolling(fetchNotificacoes, {
      activeInterval: 10_000,
      hiddenInterval: 60_000,
    });
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
