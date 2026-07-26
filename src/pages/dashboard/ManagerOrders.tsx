
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePedidos } from "@/hooks/useSupabaseData";
import { useNotificacoes } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { InvoiceModal } from "@/components/checkout/InvoiceModal";
import { useState } from "react";
import { Receipt, Clock, User, MapPin, DollarSign, Phone, MessageSquare, Volume2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { ativarSomNovoPedido, somNovoPedidoAtivo } from "@/lib/notificationSound";
import { DeliveryApprovalPanel } from "@/components/delivery/DeliveryApprovalPanel";
import { OrderItemDetails } from "@/components/orders/OrderItemDetails";

const ManagerOrders = () => {
  const {
    pedidos,
    loading,
    refreshing,
    atualizarStatusPedido,
    newOrdersCount,
    markOrdersSeen,
    refreshPedidos,
  } = usePedidos();
  const { notificacoes, marcarComoLida } = useNotificacoes();
  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(
    () => somNovoPedidoAtivo()
      && (typeof Notification === 'undefined' || Notification.permission === 'granted'),
  );
  const [somAtivo, setSomAtivo] = useState(() => somNovoPedidoAtivo());
  const [ativandoAvisos, setAtivandoAvisos] = useState(false);

  const ativarNotificacoes = async () => {
    setAtivandoAvisos(true);
    try {
      const audioAtivado = await ativarSomNovoPedido();
      setSomAtivo(audioAtivado);

      let notificacaoAtivada = false;
      if (typeof Notification !== 'undefined' && window.isSecureContext) {
        const permissao = Notification.permission === 'default'
          ? await Notification.requestPermission()
          : Notification.permission;
        notificacaoAtivada = permissao === 'granted';
      }
      setNotificacoesAtivas(audioAtivado && notificacaoAtivada);

      if (!audioAtivado) {
        toast({
          title: 'O navegador bloqueou o som',
          description: 'Verifique se esta aba ou o site estão silenciados e tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: notificacaoAtivada ? 'Som e notificações ativados' : 'Som de novos pedidos ativado',
        description: notificacaoAtivada
          ? 'Você ouvirá um aviso e receberá uma notificação quando chegar um pedido.'
          : 'O som está funcionando. As notificações do sistema não foram autorizadas pelo navegador.',
      });
    } finally {
      setAtivandoAvisos(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'confirmado': 'bg-blue-100 text-blue-800',
      'preparando': 'bg-orange-100 text-orange-800',
      'pronto': 'bg-green-100 text-green-800',
      'saiu_entrega': 'bg-purple-100 text-purple-800',
      'entregue': 'bg-gray-100 text-gray-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'pendente': 'Pendente',
      'confirmado': 'Confirmado',
      'preparando': 'Preparando',
      'pronto': 'Pronto',
      'saiu_entrega': 'Saiu para Entrega',
      'entregue': 'Entregue',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const handleStatusChange = async (pedidoId: string, novoStatus: string) => {
    const success = await atualizarStatusPedido(pedidoId, novoStatus);
    if (success) {
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Erro ao atualizar o status do pedido.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentStatus = async (pedidoId: string, status: string) => {
    try {
      await apiRequest(`/pedidos/${pedidoId}/pagamento`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await refreshPedidos();
      toast({
        title: 'Pagamento atualizado',
        description: status === 'confirmado'
          ? 'Pagamento confirmado pela equipe.'
          : 'Pagamento voltou para pendente.',
      });
    } catch (error) {
      toast({
        title: 'Não foi possível atualizar o pagamento',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = async () => {
    await refreshPedidos();
    toast({
      title: newOrdersCount > 0 ? 'Novo pedido carregado' : 'Pedidos atualizados',
      description: newOrdersCount > 0
        ? `${newOrdersCount} novo(s) pedido(s) foram carregados no topo da lista.`
        : 'A lista já está atualizada e os pedidos mais recentes estão no topo.',
    });
  };

  // Função para extrair telefone dos itens do pedido
  type PedidoType = {
    tipo_cliente?: string;
    itens_pedido: Array<{ observacoes?: string }>;
  };
  const getTelefoneCliente = (pedido: unknown) => {
    const p = pedido as PedidoType;
    if (p.tipo_cliente === 'convidado') {
      try {
        const primeiroItem = p.itens_pedido[0];
        if (primeiroItem?.observacoes) {
          const parsed = JSON.parse(primeiroItem.observacoes);
          return parsed.telefone_cliente || '';
        }
      } catch (e) {
        return '';
      }
    }
    return '';
  };

  // Função para verificar se é um pedido para retirada no local
  const isRetiradaLocal = (endereco: string) => {
    return endereco.toLowerCase().includes('retirada') || 
           endereco.toLowerCase().includes('balcão') || 
           endereco.toLowerCase().includes('local');
  };

  const handleViewInvoice = (pedido: any) => {
    // Transformar dados do pedido para o formato da nota fiscal
    const telefoneCliente = pedido.telefone_cliente
      || pedido.perfis?.telefone
      || '';
    
    const items = pedido.itens_pedido.map((item: any) => {
      let customizations: any = {
        selections: Array.isArray(item.selecoes) ? item.selecoes : [],
        variations: item.variacao_nome ? {
          [item.tipo_variacao || 'Variação']: {
            nome: item.variacao_nome,
          },
        } : {},
        notes: '',
      };
      let name = item.produto_nome || 'Produto';
      try {
        if (item.observacoes) {
          const parsed = JSON.parse(item.observacoes);
          name = parsed.nome || name;
          customizations = {
            ...customizations,
            ...(parsed.customizations || {}),
            selections: customizations.selections.length > 0
              ? customizations.selections
              : parsed.customizations?.selections || [],
          };
        }
      } catch {
        customizations.notes = item.observacoes || '';
      }
      return {
        id: item.id,
        name: name,
        price: item.preco_unitario,
        quantity: item.quantidade,
        totalPrice: item.preco_total,
        customizations: customizations
      };
    });
    const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.totalPrice) || 0), 0);
    const taxaEntrega = Number(pedido.taxa_entrega) || 0;
    const total = Number((subtotal + taxaEntrega).toFixed(2));
    const isLocalPickup = isRetiradaLocal(pedido.endereco_entrega);
    
    const invoiceData = {
      id: pedido.id,
      numeroOrdem: pedido.numero_pedido,
      nomeDestinatario: pedido.nome_cliente,
      telefone: telefoneCliente,
      endereco: isLocalPickup ? 'Retirada no Local' : pedido.endereco_entrega,
      observacoes: pedido.observacoes,
      items,
      subtotal,
      taxaEntrega,
      desconto: Number(pedido.desconto || 0),
      total: Number(pedido.valor_total || total),
      dataHora: pedido.criado_em,
      formaPagamento: pedido.forma_pagamento || 'Não informado'
    };
    
    setSelectedInvoice(invoiceData);
    setShowInvoiceModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout title="Pedidos" userType="manager">
        <div>Carregando pedidos...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pedidos" userType="manager">
      <div className="space-y-6">
        <DeliveryApprovalPanel />
        {!somAtivo ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void ativarNotificacoes()}
            disabled={ativandoAvisos}
          >
            <Volume2 className="mr-2 h-5 w-5" />
            {ativandoAvisos ? 'Ativando avisos...' : 'Ativar som e notificações de novos pedidos'}
          </Button>
        ) : (
          <div className="flex min-h-12 items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800">
            <Volume2 className="h-5 w-5" />
            {notificacoesAtivas
              ? 'Som e notificações de novos pedidos estão ativos'
              : 'Som de novos pedidos está ativo'}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{pedidos.filter(p => p.status === 'pendente').length}</div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{pedidos.filter(p => p.status === 'preparando').length}</div>
              <p className="text-sm text-muted-foreground">Preparando</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{pedidos.filter(p => p.status === 'saiu_entrega').length}</div>
              <p className="text-sm text-muted-foreground">Em Entrega</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{pedidos.filter(p => p.status === 'entregue').length}</div>
              <p className="text-sm text-muted-foreground">Entregues</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
            {newOrdersCount > 0 && (
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 p-3 rounded">
                <div className="text-sm text-yellow-800">Você tem <strong>{newOrdersCount}</strong> novo(s) pedido(s).</div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void handleRefresh()} disabled={refreshing}>
                    {refreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {refreshing ? 'Atualizando...' : 'Atualizar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    // mark orders seen locally
                    markOrdersSeen();
                    // also mark related notifications as read
                    try {
                      notificacoes.filter(n => !n.lida && n.tipo === 'pedido').forEach(n => marcarComoLida(n.id));
                    } catch (e) {}
                  }}>
                    Marcar como vistos
                  </Button>
                </div>
              </div>
            )}
          {pedidos.map((pedido) => {
            const telefoneCliente = getTelefoneCliente(pedido);
            
            return (
              <Card key={pedido.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Pedido #{pedido.numero_pedido}</CardTitle>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="mr-1 h-4 w-4" />
                        {new Date(pedido.criado_em).toLocaleString()}
                      </div>
                    </div>
                    <Badge className={getStatusColor(pedido.status)}>
                      {getStatusLabel(pedido.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span className="font-medium">{pedido.perfis?.nome_completo || pedido.nome_cliente}</span>
                      </div>
                      {telefoneCliente && (
                        <div className="flex items-center">
                          <Phone className="mr-2 h-4 w-4" />
                          <span className="text-sm">{telefoneCliente}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        <span className="text-sm">{pedido.endereco_entrega}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        <span className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline">
                          {pedido.forma_pagamento === 'dinheiro' ? 'Dinheiro' : 'PIX'}
                        </Badge>
                        <Badge className={
                          pedido.status_pagamento === 'confirmado'
                            ? 'bg-green-100 text-green-800'
                            : pedido.status_pagamento === 'informado'
                              ? 'bg-amber-500 text-white'
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          Pagamento {pedido.status_pagamento === 'confirmado'
                            ? 'confirmado'
                            : pedido.status_pagamento === 'informado'
                              ? 'informado pelo cliente'
                            : 'pendente'}
                        </Badge>
                        {pedido.forma_pagamento && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handlePaymentStatus(
                              pedido.id,
                              pedido.status_pagamento === 'confirmado'
                                ? 'pendente'
                                : 'confirmado',
                            )}
                          >
                            {pedido.status_pagamento === 'confirmado'
                              ? 'Reabrir conferência'
                              : pedido.forma_pagamento === 'dinheiro'
                                ? 'Confirmar recebimento'
                                : 'Confirmar PIX'}
                          </Button>
                        )}
                      </div>
                      {pedido.forma_pagamento === 'pix' && pedido.status_pagamento === 'informado' && (
                        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-950">
                          <strong className="block text-base">O cliente informou que efetuou o PIX</strong>
                          Confira o recebimento no aplicativo bancário. Somente depois clique em
                          “Confirmar PIX”.
                        </div>
                      )}
                      {pedido.observacoes && (
                        <div className="flex items-start mt-2">
                          <MessageSquare className="mr-2 h-4 w-4 mt-1 text-blue-600" />
                          <div>
                            <span className="font-medium text-blue-600">Observações do Cliente:</span>
                            <p className="text-sm text-gray-700 mt-1 bg-blue-50 p-2 rounded-md">{pedido.observacoes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Itens do Pedido:</h4>
                      {pedido.itens_pedido && pedido.itens_pedido.length > 0 ? (
                        <div className="grid gap-3">
                          {pedido.itens_pedido.map((item) => (
                            <OrderItemDetails key={item.id} item={item} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Nenhum item no pedido</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t mt-4">
                    <Button
                      onClick={() => handleViewInvoice(pedido)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Receipt className="h-4 w-4" />
                      Ver Nota Fiscal
                    </Button>
                    
                    <div className="flex gap-2">
                      {pedido.status !== 'entregue' && pedido.status !== 'cancelado' && (
                        <div className="flex gap-2 mt-4">
                          {pedido.status === 'pendente' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleStatusChange(pedido.id, 'confirmado')}
                              >
                                Confirmar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleStatusChange(pedido.id, 'cancelado')}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                          {pedido.status === 'confirmado' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStatusChange(pedido.id, 'preparando')}
                            >
                              Iniciar Preparo
                            </Button>
                          )}
                          {pedido.status === 'preparando' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStatusChange(pedido.id, 'pronto')}
                            >
                              Marcar como Pronto
                            </Button>
                          )}
                          {pedido.status === 'pronto' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStatusChange(pedido.id, 'saiu_entrega')}
                            >
                              Saiu para Entrega
                            </Button>
                          )}
                          {pedido.status === 'saiu_entrega' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStatusChange(pedido.id, 'entregue')}
                            >
                              Marcar como Entregue
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      
      {selectedInvoice && (
        <InvoiceModal
          open={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          invoiceData={selectedInvoice}
        />
      )}
    </DashboardLayout>
  );
};

export default ManagerOrders;
