
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, Package } from "lucide-react";
import { useAvailableDeliveries } from "@/hooks/useDeliveryData";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const DeliveryAvailable = () => {
  const { deliveries, loading, acceptDelivery } = useAvailableDeliveries();
  const { toast } = useToast();

  const handleAcceptDelivery = async (deliveryId: string) => {
    const success = await acceptDelivery(deliveryId);
    
    if (success) {
      toast({
        title: "Solicitação enviada",
        description: "A equipe irá analisar sua solicitação antes de liberar a entrega.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível solicitar esta entrega. Ela pode não estar mais disponível.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Entregas Disponíveis" userType="delivery">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kumekume-orange"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Entregas Disponíveis" userType="delivery">
      <div className="space-y-4">
        {deliveries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma entrega disponível
              </h3>
              <p className="text-gray-500">
                Não há entregas prontas para serem entregues no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Pedido #{delivery.numero_pedido}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-orange-100 text-orange-800">
                        Pronto para entrega
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {delivery.pronto_em && formatDistanceToNow(new Date(delivery.pronto_em), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {Number(delivery.valor_total).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Taxa: R$ {Number(delivery.taxa_entrega).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Informações do Cliente */}
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <span className="font-medium">Nome:</span>
                      <span className="ml-2">{delivery.nome_cliente || delivery.perfis?.nome_completo || 'Cliente'}</span>
                    </div>
                    {delivery.perfis?.telefone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        <span>{delivery.perfis.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Endereço de Entrega */}
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Endereço de Entrega
                  </h4>
                  <p className="text-sm text-gray-700">{delivery.endereco_entrega}</p>
                </div>

                {/* Itens do Pedido */}
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {delivery.itens_pedido.map((item) => {
                      // Extrair variações do item
                      let variacoes: string[] = [];
                      if (item.observacoes) {
                        try {
                          const obs = JSON.parse(item.observacoes);
                          if (obs.customizations && obs.customizations.variations && typeof obs.customizations.variations === 'object') {
                            variacoes = Object.entries(obs.customizations.variations).map(
                              ([tipo, valor]) => `${tipo}: ${typeof valor === 'object' && valor !== null && 'nome' in valor ? valor.nome : valor}`
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
                        } catch (e) {
                          // ignorar erro de parse
                        }
                      }
                      return (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium">{item.quantidade}x</span>
                            <span className="ml-2">{item.produto_nome}</span>
                            {variacoes.length > 0 && (
                              <span className="ml-2 flex flex-wrap gap-1">
                                {variacoes.map((v, i) => (
                                  <span key={i} className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs font-semibold">{v}</span>
                                ))}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">R$ {Number(item.preco_total).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Observações */}
                {delivery.observacoes && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                    <p className="text-sm text-gray-700">{delivery.observacoes}</p>
                  </div>
                )}

                {/* Botão de Ação */}
                <div className="pt-2">
                  <Button 
                    onClick={() => handleAcceptDelivery(delivery.id)}
                    className="w-full bg-kumekume-orange hover:bg-orange-600"
                  >
                    Solicitar Entrega
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeliveryAvailable;
