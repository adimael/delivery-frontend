
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { startSmartPolling } from '@/lib/smartPolling';

export interface DeliveryOrder {
  id: string;
  numero_pedido: string;
  cliente_id: string | null;
  nome_cliente: string | null;
  valor_total: number;
  endereco_entrega: string;
  observacoes?: string;
  observacoes_entrega?: string;
  taxa_entrega: number;
  status: 'pronto' | 'saiu_entrega' | 'entregue' | 'cancelado' | 'pendente' | 'confirmado' | 'preparando';
  criado_em: string;
  pronto_em?: string;
  entregue_em?: string;
  entregador_id?: string;
  tipo_cliente?: string;
  perfis?: {
    nome_completo: string;
    telefone?: string;
  } | null;
  entregador?: {
    nome_completo: string;
    telefone?: string;
  };
  itens_pedido: Array<{
    id: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
    observacoes?: string;
    produto_nome?: string;
  }>;
}

export interface DeliveryGains {
  id: string;
  valor_entrega: number;
  data_entrega: string;
  pedido_id: string;
  numero_pedido?: string;
}

// Tipo auxiliar recebido do backend (campos podem vir como strings/undefined)
export type ApiOrder = Partial<{
  id: string;
  numero_pedido: string;
  cliente_id: string | null;
  nome_cliente: string | null;
  valor_total: number | string;
  endereco_entrega: string;
  observacoes: string;
  observacoes_entrega: string;
  taxa_entrega: number | string;
  status: DeliveryOrder['status'];
  criado_em: string;
  pronto_em: string;
  entregue_em: string;
  entregador_id: string;
  tipo_cliente: string;
  perfis: Partial<{
    nome_completo: string;
    telefone?: string;
  }> | null;
  entregador: Partial<{
    nome_completo: string;
    telefone?: string;
  }> | null;
  atualizado_em: string;
  valor_entrega: number | string;
  data_entrega: string;
  pedido_uuid: string;
  itens_pedido: Array<Partial<{
    id: string;
    quantidade: number | string;
    preco_unitario: number | string;
    preco_total: number | string;
    observacoes: string;
    produto_nome: string;
  }>>;
}>;
export const useAvailableDeliveries = () => {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const prevCountRef = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAvailableDeliveries = async () => {
      if (!user) return;
      try {
        const data = await apiRequest('/pedidos');
        if (!Array.isArray(data)) {
          setDeliveries([]);
        } else {
          // Filtrar pedidos com status 'pronto'
          const items = (data || []) as ApiOrder[];
          const filtered = items
            .filter((pedido) => pedido.status === 'pronto')
            .map((delivery) => ({
              id: String(delivery.id ?? ''),
              numero_pedido: String(delivery.numero_pedido ?? ''),
              cliente_id: delivery.cliente_id ?? null,
              nome_cliente: delivery.nome_cliente ?? null,
              valor_total: Number(delivery.valor_total ?? 0),
              endereco_entrega: String(delivery.endereco_entrega ?? ''),
              observacoes: delivery.observacoes,
              observacoes_entrega: delivery.observacoes_entrega,
              taxa_entrega: Number(delivery.taxa_entrega ?? 0),
              status: (delivery.status as DeliveryOrder['status']) || 'pendente',
              criado_em: String(delivery.criado_em ?? new Date().toISOString()),
              pronto_em: delivery.pronto_em,
              entregue_em: delivery.entregue_em,
              entregador_id: delivery.entregador_id,
              tipo_cliente: delivery.tipo_cliente,
              perfis: delivery.perfis ?? null,
              entregador: delivery.entregador ?? null,
              itens_pedido: (delivery.itens_pedido || []).map((it) => ({
                id: String(it?.id ?? ''),
                quantidade: Number(it?.quantidade ?? 0),
                preco_unitario: Number(it?.preco_unitario ?? 0),
                preco_total: Number(it?.preco_total ?? 0),
                observacoes: it?.observacoes,
                produto_nome: it?.produto_nome,
              }))
            } as DeliveryOrder));
          // notify if new deliveries appeared
          const prev = prevCountRef.current || 0;
          const nextCount = filtered.length;
          if (nextCount > prev) {
            const added = nextCount - prev;
            try {
              // in-app toast
              try { toast?.({ title: 'Novas entregas disponíveis', description: `Há ${added} nova(s) entrega(s) disponíveis.` }); } catch (e) { /* ignore */ }
              // browser notification
              if (typeof Notification !== 'undefined') {
                if (Notification.permission === 'granted') {
                  new Notification('Novas entregas', { body: `Há ${added} novas entrega(s) disponíveis.` });
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then((perm) => {
                    if (perm === 'granted') {
                      new Notification('Novas entregas', { body: `Há ${added} novas entrega(s) disponíveis.` });
                    }
                  }).catch(() => {});
                }
              }
            } catch (e) { console.warn('Erro ao notificar sobre novas entregas', e); }
          }
          prevCountRef.current = nextCount;
          setDeliveries(filtered);
        }
      } catch (error) {
        setDeliveries([]);
      }
      setLoading(false);
    };
    fetchAvailableDeliveries();
    const stopPolling = startSmartPolling(fetchAvailableDeliveries);

    return () => {
      stopPolling();
    };
  }, [user, toast]);

  // Aceitar entrega via endpoint do backend
  const acceptDelivery = async (deliveryId: string) => {
    if (!user) return false;
    try {
      await apiRequest(`/pedidos/${deliveryId}/solicitar-entrega`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  return { deliveries, loading, acceptDelivery };
};

export const useMyDeliveries = () => {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMyDeliveries = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiRequest('/pedidos');
      if (!Array.isArray(data)) {
        setDeliveries([]);
      } else {
        // Filtrar pedidos do entregador logado
        const items = (data || []) as ApiOrder[];
        const filtered = items
          .filter((pedido) => pedido.entregador_id === user.id)
          .map((delivery) => ({
            id: String(delivery.id ?? ''),
            numero_pedido: String(delivery.numero_pedido ?? ''),
            cliente_id: delivery.cliente_id ?? null,
            nome_cliente: delivery.nome_cliente ?? null,
            valor_total: Number(delivery.valor_total ?? 0),
            endereco_entrega: String(delivery.endereco_entrega ?? ''),
            observacoes: delivery.observacoes,
            observacoes_entrega: delivery.observacoes_entrega,
            taxa_entrega: Number(delivery.taxa_entrega ?? 0),
            status: (delivery.status as DeliveryOrder['status']) || 'pendente',
            criado_em: String(delivery.criado_em ?? new Date().toISOString()),
            pronto_em: delivery.pronto_em,
            entregue_em: delivery.entregue_em,
            entregador_id: delivery.entregador_id,
            tipo_cliente: delivery.tipo_cliente,
            perfis: delivery.perfis ?? null,
            entregador: delivery.entregador ?? null,
            itens_pedido: (delivery.itens_pedido || []).map((it) => ({
              id: String(it?.id ?? ''),
              quantidade: Number(it?.quantidade ?? 0),
              preco_unitario: Number(it?.preco_unitario ?? 0),
              preco_total: Number(it?.preco_total ?? 0),
              observacoes: it?.observacoes,
              produto_nome: it?.produto_nome,
            }))
          } as DeliveryOrder));
        setDeliveries(filtered);
      }
    } catch (error) {
      setDeliveries([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMyDeliveries();

    // Adicionar listener do Socket.IO para atualização em tempo real
    const stopPolling = startSmartPolling(fetchMyDeliveries);
    return () => {
      stopPolling();
    };
  }, [fetchMyDeliveries]);

  const completeDelivery = async (deliveryId: string) => {
    try {
      await apiRequest(`/pedidos/${deliveryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'entregue' }),
      });
      await fetchMyDeliveries();
      return true;
    } catch {
      return false;
    }
  };

  return { deliveries, loading, completeDelivery, refresh: fetchMyDeliveries };
};

export const useDeliveryGains = () => {
  const [gains, setGains] = useState<DeliveryGains[]>([]);
  const [totalGains, setTotalGains] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchGains = async () => {
      if (!user) return;
      try {
        const data = await apiRequest('/entregador/ganhos');
        if (!Array.isArray(data?.entregas)) {
          setGains([]);
          setTotalGains(0);
        } else {
          // Filtrar pedidos entregues pelo entregador logado
          const items = (data.entregas || []) as ApiOrder[];
          // apenas considerar pedidos entregues atribuídos ao entregador e que tenham data de entrega
          const entregues = items;
          
          // Usar a taxa de entrega configurada atualmente, ou 5.00 como padrão
          // Tratar corretamente o valor 0 (não usar o valor padrão quando a taxa for 0)
          const taxaEntregaConfigurada = 0;
          
          if (!entregues || entregues.length === 0) {
            setGains([]);
            setTotalGains(0);
            setLoading(false);
            return;
          }

          const gainsFormatted: DeliveryGains[] = entregues.map((pedido) => ({
            id: String(pedido.id ?? ''),
            valor_entrega: Number(pedido.valor_entrega ?? taxaEntregaConfigurada),
            data_entrega: String(pedido.data_entrega ?? new Date().toISOString()),
            pedido_id: String(pedido.pedido_uuid ?? pedido.id ?? ''),
            numero_pedido: String(pedido.numero_pedido ?? '')
          }));
          setGains(gainsFormatted);
          const total = Number(data.total ?? gainsFormatted.reduce((acc, gain) => acc + Number(gain.valor_entrega), 0));
          setTotalGains(total);
        }
      } catch (error) {
        setGains([]);
        setTotalGains(0);
      }
      setLoading(false);
    };
    fetchGains();
  }, [user]);

  return { gains, totalGains, loading };
};
