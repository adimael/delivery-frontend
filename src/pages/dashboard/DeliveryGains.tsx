import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, Package, TrendingUp } from "lucide-react";
import { useDeliveryGains } from "@/hooks/useDeliveryData";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DeliveryGains = () => {
  const { gains, totalGains, loading } = useDeliveryGains();
  const { configuracao } = useEstabelecimento();

  if (loading) {
    return (
      <DashboardLayout title="Meus Ganhos" userType="delivery">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kumekume-orange"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Filtrar ganhos de hoje
  const todayGains = gains.filter(gain => {
    const gainDate = new Date(gain.data_entrega);
    const today = new Date();
    return gainDate.toDateString() === today.toDateString();
  });

  // Calcular total de hoje baseado nos ganhos reais registrados
  const todayTotal = todayGains.reduce((acc, gain) => acc + Number(gain.valor_entrega), 0);

  // Taxa de entrega configurada (padrão R$ 5,00 se não configurada)
  const taxaEntrega = configuracao?.taxa_entrega !== undefined && configuracao?.taxa_entrega !== null 
    ? Number(configuracao.taxa_entrega) 
    : 5.00;

  return (
    <DashboardLayout title="Meus Ganhos" userType="delivery">
      <div className="space-y-6">
        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Geral
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {totalGains.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Todos os ganhos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Hoje
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R$ {todayTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {todayGains.length} entregas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Entregas
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gains.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Entregas realizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa por Entrega
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                R$ {taxaEntrega.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa configurada
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info sobre ganhos */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Como funcionam os ganhos</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Você recebe R$ {taxaEntrega.toFixed(2)} por cada entrega realizada. 
                  Os ganhos são registrados automaticamente quando você finaliza uma entrega.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Ganhos */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Ganhos</CardTitle>
          </CardHeader>
          <CardContent>
            {gains.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum ganho registrado
                </h3>
                <p className="text-gray-500">
                  Seus ganhos aparecerão aqui após realizar entregas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {gains.map((gain) => (
                  <div key={gain.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-2 rounded-full">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          Pedido #{gain.numero_pedido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(gain.data_entrega), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        + R$ {Number(gain.valor_entrega).toFixed(2)}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        Entrega
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DeliveryGains;
