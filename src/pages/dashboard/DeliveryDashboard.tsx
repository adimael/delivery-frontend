
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Truck, Check, MapPin, DollarSign } from "lucide-react";
import { useAvailableDeliveries, useMyDeliveries, useDeliveryGains } from "@/hooks/useDeliveryData";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { useNavigate } from "react-router-dom";

const DeliveryDashboard = () => {
  const { deliveries: availableDeliveries, loading: loadingAvailable } = useAvailableDeliveries();
  const { deliveries: myDeliveries } = useMyDeliveries();
  const { totalGains, gains } = useDeliveryGains();
  const { configuracao } = useEstabelecimento();
  const navigate = useNavigate();

  const inProgressDeliveries = myDeliveries.filter(d => d.status === 'saiu_entrega');
  const completedToday = myDeliveries.filter(d => {
    if (d.status !== 'entregue' || !d.entregue_em) return false;
    const deliveryDate = new Date(d.entregue_em);
    const today = new Date();
    return deliveryDate.toDateString() === today.toDateString();
  });

  // Calcular ganhos de hoje baseado nos registros reais (useDeliveryGains)
  const taxaEntrega = Number(configuracao?.taxa_entrega) || 5.0;
  const todayRecorded = gains.filter(g => {
    const d = new Date(g.data_entrega);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const todayGains = todayRecorded.reduce((acc, g) => acc + Number(g.valor_entrega), 0);

  return (
    <DashboardLayout title="Dashboard" userType="delivery">
      <div className="space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Disponíveis
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableDeliveries.length}</div>
              <p className="text-xs text-muted-foreground">
                Entregas disponíveis
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Em Andamento
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressDeliveries.length}</div>
              <p className="text-xs text-muted-foreground">
                Entregas em rota
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Finalizadas Hoje
              </CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedToday.length}</div>
              <p className="text-xs text-muted-foreground">
                Entregas concluídas hoje
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ganhos Hoje
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {todayGains.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                R$ {taxaEntrega.toFixed(2)} por entrega
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Entregas Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {availableDeliveries.length > 0 
                    ? `${availableDeliveries.length} entregas aguardando entregadores`
                    : 'Nenhuma entrega disponível no momento'
                  }
                </p>
                <Button 
                  onClick={() => navigate('/dashboard/entregador/disponivel')}
                  className="w-full"
                  disabled={availableDeliveries.length === 0}
                >
                  Ver Entregas Disponíveis
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Minhas Entregas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {inProgressDeliveries.length > 0 
                    ? `${inProgressDeliveries.length} entregas em andamento`
                    : 'Nenhuma entrega em andamento'
                  }
                </p>
                <Button 
                  onClick={() => navigate('/dashboard/entregador/entregas')}
                  variant="outline"
                  className="w-full"
                >
                  Ver Minhas Entregas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Ganhos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Resumo de Ganhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  R$ {todayGains.toFixed(2)}
                </div>
                <p className="text-sm text-gray-500">Hoje ({completedToday.length} entregas)</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  R$ {totalGains.toFixed(2)}
                </div>
                <p className="text-sm text-gray-500">Total Geral</p>
              </div>
              <div className="text-center">
                <Button 
                  onClick={() => navigate('/dashboard/entregador/ganhos')}
                  variant="outline"
                >
                  Ver Detalhes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DeliveryDashboard;
