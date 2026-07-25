import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePedidos } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { InvoiceModal } from "@/components/checkout/InvoiceModal";
import { useState } from "react";
import { Receipt, MessageSquare, User, CheckCircle, MapPin } from "lucide-react";
import { Pedido } from '@/hooks/useSupabaseData';
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { DeliveryApprovalPanel } from "@/components/delivery/DeliveryApprovalPanel";

type ItemPedido = Pedido['itens_pedido'][number];

const statusLabelMap: Record<string, string> = {
  "pendente": "Pendente",
  "confirmado": "Confirmado",
  "preparando": "Preparando",
  "pronto": "Pronto",
  "saiu_entrega": "Saiu para Entrega",
  "entregue": "Entregue",
  "cancelado": "Cancelado"
};

const statusColorMap: Record<string, string> = {
  "pendente": "bg-yellow-500",
  "confirmado": "bg-blue-500",
  "preparando": "bg-orange-500",
  "pronto": "bg-green-500",
  "saiu_entrega": "bg-purple-500",
  "entregue": "bg-green-600",
  "cancelado": "bg-red-500"
};

type StatusPedido = 'pendente' | 'confirmado' | 'preparando' | 'pronto' | 'saiu_entrega' | 'entregue' | 'cancelado';

const StaffOrders = () => {
  const { pedidos, loading, atualizarStatusPedido } = usePedidos();
  const { configuracao } = useEstabelecimento();
  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  if (loading) {
    return (
      <DashboardLayout title="Pedidos" userType="staff">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kumekume-orange"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleStatusChange = async (pedidoId: string, novoStatus: StatusPedido) => {
    try {
      const sucesso = await atualizarStatusPedido(pedidoId, novoStatus);
      if (sucesso) {
        toast({
          title: "Status atualizado",
          description: `Pedido atualizado para ${statusLabelMap[novoStatus]}`,
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o status do pedido. Verifique suas permissões.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao atualizar status do pedido.",
        variant: "destructive",
      });
    }
  };

  const handleViewInvoice = (pedido: any) => {
    // Transformar dados do pedido para o formato da nota fiscal
    const enderecoCompleto = pedido.endereco_entrega.split(', ');
    
    let telefoneCliente = '';
    if (pedido.tipo_cliente === 'convidado') {
      try {
        const primeiroItem = pedido.itens_pedido[0];
        if (primeiroItem?.observacoes) {
          const parsed = JSON.parse(primeiroItem.observacoes);
          telefoneCliente = parsed.telefone_cliente || '';
        }
      } catch (e) {
        // Se não conseguir extrair o telefone, deixa vazio
      }
    }
    
    const items = pedido.itens_pedido.map(item => {
      let customizations = null;
      let name = item.produto_nome || 'Produto';
      try {
        if (item.observacoes) {
          const parsed = JSON.parse(item.observacoes);
          name = parsed.nome || name;
          customizations = parsed.customizations;
        }
      } catch (e) {
        // Se não conseguir fazer parse, usa valores padrão
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
    const subtotal = items.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);
    const taxaEntrega = Number(pedido.taxa_entrega) || 0;
    const total = Number((subtotal + taxaEntrega).toFixed(2));
    const isLocalPickup = isRetiradaLocal(pedido.endereco_entrega);
    
    // Use configurable establishment address
    const enderecoEstabelecimento = configuracao?.endereco_estabelecimento || "Av. Nélson Leite Leal, Nº 106";
    const cidadeEstabelecimento = configuracao?.cidade_estabelecimento || "Teotônio Calheira";
    const estadoEstabelecimento = configuracao?.estado_estabelecimento || "BA";
    const cepEstabelecimento = configuracao?.cep_estabelecimento || "45450-000";
    const enderecoLoja = `${enderecoEstabelecimento}\n${cidadeEstabelecimento}, ${estadoEstabelecimento} cep: ${cepEstabelecimento}`;
    
    const invoiceData = {
      id: pedido.id,
      numeroOrdem: pedido.numero_pedido,
      nomeDestinatario: pedido.nome_cliente,
      telefone: telefoneCliente,
      endereco: isLocalPickup ? enderecoLoja : (enderecoCompleto[0] || pedido.endereco_entrega),
      numero: enderecoCompleto[1] || '',
      complemento: enderecoCompleto[2] || '',
      bairro: enderecoCompleto[3] || '',
      cidade: enderecoCompleto[4] || '',
      cep: enderecoCompleto[5] || '',
      observacoes: pedido.observacoes,
      items,
      subtotal,
      taxaEntrega,
      total,
      dataHora: pedido.criado_em,
      formaPagamento: 'pix'
    };
    
    setSelectedInvoice(invoiceData);
    setShowInvoiceModal(true);
  };

  const getNextStatus = (currentStatus: string, hasDeliveryPerson: boolean): StatusPedido | null => {
    switch (currentStatus) {
      case 'pendente': return 'confirmado';
      case 'confirmado': return 'preparando';
      case 'preparando': return 'pronto';
      case 'pronto': return hasDeliveryPerson ? 'saiu_entrega' : null;
      case 'saiu_entrega': return 'entregue';
      default: return null;
    }
  };

  const getNextStatusLabel = (currentStatus: string, hasDeliveryPerson: boolean) => {
    const nextStatus = getNextStatus(currentStatus, hasDeliveryPerson);
    return nextStatus ? statusLabelMap[nextStatus] : null;
  };

  const getTelefoneCliente = (pedido: any) => {
    if (pedido.tipo_cliente === 'convidado') {
      try {
        const primeiroItem = pedido.itens_pedido[0];
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

  return (
    <DashboardLayout title="Gerenciar Pedidos" userType="staff">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Pedidos</h1>
        
        {pedidos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Nenhum pedido encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pedidos.map(pedido => {
              const telefoneCliente = getTelefoneCliente(pedido);
              const hasDeliveryPerson = !!pedido.entregador_id;
              const isLocalPickup = isRetiradaLocal(pedido.endereco_entrega);
              
              return (
                <Card key={pedido.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Pedido #{pedido.numero_pedido}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Cliente: {pedido.perfis?.nome_completo || pedido.nome_cliente || 'Cliente não logado'}
                        </p>
                        {telefoneCliente && (
                          <p className="text-sm text-gray-600">
                            Telefone: {telefoneCliente}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {new Date(pedido.criado_em).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={statusColorMap[pedido.status]}>
                          {statusLabelMap[pedido.status]}
                        </Badge>
                        <p className="text-lg font-semibold text-kumekume-orange mt-2">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
                        </p>
                        {isLocalPickup && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                            <MapPin className="h-3 w-3" />
                            <span>Retirada Local</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
      <div className="space-y-4">
        <DeliveryApprovalPanel />
                      {/* Informações do entregador */}
                      {pedido.status === 'pronto' && hasDeliveryPerson && !isLocalPickup && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-semibold">Entregador Aceito!</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-green-600">
                            <User className="h-4 w-4" />
                            <span className="text-sm">
                              {pedido.entregador?.nome_completo} foi autorizado para esta entrega
                            </span>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-2">Itens do Pedido:</h4>
                        <ul className="space-y-1">
                          {pedido.itens_pedido.map((item: ItemPedido) => {
                            let nomeExibicao = item.produto_nome || 'Produto';
                            let variacoes: string[] = [];
                            let observacoesPersonalizadas = "";
                            if (item.observacoes) {
                              try {
                                const obs = JSON.parse(item.observacoes);
                                nomeExibicao = obs.nome || nomeExibicao;
                                if (obs.customizations && obs.customizations.variations && typeof obs.customizations.variations === 'object') {
                                  variacoes = Object.entries(obs.customizations.variations).map(
                                    ([tipo, valor]: [string, unknown]) => `${tipo}: ${typeof valor === 'object' && valor !== null && 'nome' in valor ? (valor as { nome: string }).nome : valor}`
                                  );
                                } else if (obs.variacoes && typeof obs.variacoes === 'object') {
                                  variacoes = Object.entries(obs.variacoes).map(
                                    ([tipo, valor]) => `${tipo}: ${valor}`
                                  );
                                } else if (obs.opcoes && typeof obs.opcoes === 'object') {
                                  variacoes = Object.entries(obs.opcoes).map(
                                    ([tipo, valor]) => `${tipo}: ${valor}`
                                  );
                                } else if (obs.opcao) {
                                  variacoes = [`Opção: ${obs.opcao}`];
                                }
                                if (obs.customizations && obs.customizations.notes) {
                                  observacoesPersonalizadas = obs.customizations.notes;
                                } else if (obs.observacoes) {
                                  observacoesPersonalizadas = obs.observacoes;
                                }
                              } catch (e) {
                                // ignorar erro de parse
                              }
                            }
                            return (
                              <li key={item.id} className="flex justify-between text-sm">
                                <span>
                                  {item.quantidade}x {nomeExibicao}
                                  {variacoes.length > 0 && (
                                    <span className="ml-2 flex flex-wrap gap-1">
                                      {variacoes.map((v, i) => (
                                        <span key={i} className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs font-semibold">{v}</span>
                                      ))}
                                    </span>
                                  )}
                                  {observacoesPersonalizadas && (
                                    <span className="text-gray-500 block ml-4">
                                      {observacoesPersonalizadas}
                                    </span>
                                  )}
                                </span>
                                <span>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_total)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">
                          {isLocalPickup ? 'Tipo de Entrega:' : 'Endereço de Entrega:'}
                        </h4>
                        <p className="text-sm text-gray-600">{pedido.endereco_entrega}</p>
                      </div>
                      
                      {pedido.observacoes && (
                        <div className="flex items-start">
                          <MessageSquare className="mr-2 h-4 w-4 mt-1 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-blue-600">Observações do Cliente:</h4>
                            <p className="text-sm text-gray-700 mt-1 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">{pedido.observacoes}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-4 border-t">
                        <Button
                          onClick={() => handleViewInvoice(pedido)}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Receipt className="h-4 w-4" />
                          Ver Nota Fiscal
                        </Button>
                        
                        <div className="flex space-x-2">
                          {/* Botão de próximo status */}
                          {pedido.status === 'pendente' && (
                            <Button
                              onClick={() => handleStatusChange(pedido.id, 'confirmado')}
                              className="bg-kumekume-orange hover:bg-orange-600"
                            >
                              Confirmar Pedido
                            </Button>
                          )}
                          
                          {pedido.status === 'confirmado' && (
                            <Button
                              onClick={() => handleStatusChange(pedido.id, 'preparando')}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              Iniciar Preparo
                            </Button>
                          )}
                          
                          {pedido.status === 'preparando' && (
                            <Button
                              onClick={() => handleStatusChange(pedido.id, 'pronto')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Marcar como Pronto
                            </Button>
                          )}
                          
                          {pedido.status === 'pronto' && isLocalPickup && (
                            <Button
                              onClick={() => handleStatusChange(pedido.id, 'entregue')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Cliente Retirou o Pedido
                            </Button>
                          )}
                          
                          {pedido.status === 'pronto' && !hasDeliveryPerson && !isLocalPickup && (
                            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                              Aguardando solicitação e autorização de um entregador
                            </div>
                          )}
                          
                          {pedido.status === 'pronto' && hasDeliveryPerson && !isLocalPickup && (
                            <Button
                              onClick={() => handleStatusChange(pedido.id, 'saiu_entrega')}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              Marcar como Saiu para Entrega
                            </Button>
                          )}
                          
                          {pedido.status === 'saiu_entrega' && (
                            <Button
                              onClick={() => handleStatusChange(pedido.id, 'entregue')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Marcar como Entregue
                            </Button>
                          )}
                          
                          {/* Botão cancelar */}
                          {pedido.status !== 'cancelado' && pedido.status !== 'entregue' && (
                            <Button
                              onClick={() => handleStatusChange(pedido.id, 'cancelado')}
                              variant="destructive"
                            >
                              Cancelar Pedido
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
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

export default StaffOrders;
