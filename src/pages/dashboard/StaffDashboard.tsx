
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, Check, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePedidos } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pedido } from '@/hooks/useSupabaseData';
type ItemPedido = Pedido['itens_pedido'][number];

const StaffDashboard = () => {
  const { pedidos, loading, atualizarStatusPedido } = usePedidos();
  const { toast } = useToast();

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" userType="staff">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kumekume-orange"></div>
        </div>
      </DashboardLayout>
    );
  }

  const orderStats = {
    total: pedidos.length,
    processing: pedidos.filter(p => ['confirmado', 'preparando'].includes(p.status)).length,
    completed: pedidos.filter(p => p.status === 'pronto').length,
    pending: pedidos.filter(p => p.status === 'pendente').length
  };

  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente');
  const pedidosPreparando = pedidos.filter(p => ['confirmado', 'preparando'].includes(p.status));
  const pedidosProntos = pedidos.filter(p => p.status === 'pronto');

  const handleConfirmarPedido = async (pedidoId: string) => {
    const sucesso = await atualizarStatusPedido(pedidoId, 'confirmado');
    if (sucesso) {
      toast({
        title: "Pedido confirmado",
        description: "O pedido foi confirmado e está aguardando separação/embalagem.",
      });
    }
  };

  const handleIniciarPreparo = async (pedidoId: string) => {
    const sucesso = await atualizarStatusPedido(pedidoId, 'preparando');
    if (sucesso) {
      toast({
        title: "Separação iniciada",
        description: "O pedido está sendo separado/embalado.",
      });
    }
  };

  const handleMarcarPronto = async (pedidoId: string) => {
    const sucesso = await atualizarStatusPedido(pedidoId, 'pronto');
    if (sucesso) {
      toast({
        title: "Pedido pronto",
        description: "O pedido está pronto para retirada ou envio ao cliente.",
      });
    }
  };

  const formatarItemPedido = (item: ItemPedido) => {
    let nomeExibicao = item.produto_nome || 'Produto';
    let variacoes: string[] = [];
    let observacoesFormatadas = '';
    try {
      if (item.observacoes) {
        const parsed = JSON.parse(item.observacoes);
        nomeExibicao = parsed.nome || nomeExibicao;
        // Variações
        if (parsed.customizations && parsed.customizations.variations && typeof parsed.customizations.variations === 'object') {
          variacoes = Object.entries(parsed.customizations.variations).map(
            ([tipo, valor]) => `${tipo}: ${typeof valor === 'object' && valor !== null && 'nome' in valor ? valor.nome : valor}`
          );
        } else if (parsed.variacoes && typeof parsed.variacoes === 'object') {
          variacoes = Object.entries(parsed.variacoes).map(
            ([tipo, valor]) => `${tipo}: ${valor}`
          );
        } else if (parsed.opcoes && typeof parsed.opcoes === 'object') {
          variacoes = Object.entries(parsed.opcoes).map(
            ([tipo, valor]) => `${tipo}: ${valor}`
          );
        } else if (parsed.opcao) {
          variacoes = [`Opção: ${parsed.opcao}`];
        }
        // Customizações extras
        if (parsed.customizations) {
          const customizations = [];
          if (parsed.customizations.mainOptions?.length > 0) {
            customizations.push(`${parsed.customizations.mainOptions.map(opt => opt.name).join(", ")}`);
          }
          if (parsed.customizations.meatOptions?.length > 0) {
            customizations.push(`${parsed.customizations.meatOptions.map(opt => opt.name).join(", ")}`);
          }
          if (parsed.customizations.extraOptions?.length > 0) {
            customizations.push(`+${parsed.customizations.extraOptions.map(opt => opt.name).join(", ")}`);
          }
          if (parsed.customizations.notes) {
            customizations.push(`Obs: ${parsed.customizations.notes}`);
          }
          if (customizations.length > 0) {
            observacoesFormatadas = ` (${customizations.join(" | ")})`;
          }
        }
      }
    } catch (e) {
      // Se não conseguir fazer parse, usa apenas o nome
    }
    return (
      <span>
        {item.quantidade}x {nomeExibicao}
        {variacoes.length > 0 && (
          <span className="ml-2 flex flex-wrap gap-1">
            {variacoes.map((v, i) => (
              <span key={i} className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs font-semibold">{v}</span>
            ))}
          </span>
        )}
        {observacoesFormatadas}
      </span>
    );
  };

  return (
    <DashboardLayout title="Dashboard" userType="staff">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Cards de estatísticas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos hoje
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Em Preparo
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.processing}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos em andamento
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Prontos
            </CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos prontos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendentes
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="newOrders">
          <TabsList>
            <TabsTrigger value="newOrders">Novos Pedidos ({pedidosPendentes.length})</TabsTrigger>
            <TabsTrigger value="processing">Em Preparo ({pedidosPreparando.length})</TabsTrigger>
            <TabsTrigger value="completed">Prontos ({pedidosProntos.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="newOrders" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Aguardando Confirmação</CardTitle>
              </CardHeader>
              <CardContent>
                {pedidosPendentes.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum pedido pendente.</p>
                ) : (
                  <div className="space-y-4">
                    {pedidosPendentes.map(pedido => (
                      <div key={pedido.id} className="border p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">Pedido #{pedido.numero_pedido}</h4>
                            <p className="text-sm text-gray-600">
                              {pedido.perfis?.nome_completo || pedido.nome_cliente || 'Cliente não logado'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(pedido.criado_em).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
                          </Badge>
                        </div>
                        <div className="mb-3">
                          <h5 className="font-medium mb-1">Itens:</h5>
                          <ul className="text-sm space-y-1">
                            {pedido.itens_pedido.map(item => (
                              <li key={item.id}>
                                {formatarItemPedido(item)}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button 
                          onClick={() => handleConfirmarPedido(pedido.id)}
                          className="bg-kumekume-orange hover:bg-orange-600"
                        >
                          Confirmar Pedido
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="processing" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos em Preparo</CardTitle>
              </CardHeader>
              <CardContent>
                {pedidosPreparando.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum pedido em preparo.</p>
                ) : (
                  <div className="space-y-4">
                    {pedidosPreparando.map(pedido => (
                      <div key={pedido.id} className="border p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">Pedido #{pedido.numero_pedido}</h4>
                            <p className="text-sm text-gray-600">
                              {pedido.perfis?.nome_completo || pedido.nome_cliente || 'Cliente não logado'}
                            </p>
                            <Badge className={pedido.status === 'confirmado' ? 'bg-blue-500' : 'bg-orange-500'}>
                              {pedido.status === 'confirmado' ? 'Confirmado' : 'Preparando'}
                            </Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <h5 className="font-medium mb-1">Itens:</h5>
                          <ul className="text-sm space-y-1">
                            {pedido.itens_pedido.map(item => (
                              <li key={item.id}>
                                {formatarItemPedido(item)}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex gap-2">
                          {pedido.status === 'confirmado' && (
                            <Button 
                              onClick={() => handleIniciarPreparo(pedido.id)}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              Iniciar Preparo
                            </Button>
                          )}
                          {pedido.status === 'preparando' && (
                            <Button 
                              onClick={() => handleMarcarPronto(pedido.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Marcar como Pronto
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Prontos</CardTitle>
              </CardHeader>
              <CardContent>
                {pedidosProntos.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum pedido pronto.</p>
                ) : (
                  <div className="space-y-4">
                    {pedidosProntos.map(pedido => (
                      <div key={pedido.id} className="border p-4 rounded-lg bg-green-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">Pedido #{pedido.numero_pedido}</h4>
                            <p className="text-sm text-gray-600">
                              {pedido.perfis?.nome_completo || pedido.nome_cliente || 'Cliente não logado'}
                            </p>
                            <Badge className="bg-green-600">Pronto</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            Pronto em: {pedido.pronto_em ? new Date(pedido.pronto_em).toLocaleTimeString('pt-BR') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
