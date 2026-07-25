import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { configuracao, estaAberto, loading } = useEstabelecimento();

  // Formatar horário
  const horaAbertura = configuracao?.hora_abertura?.slice(0,5) || "08:00";
  const horaFechamento = configuracao?.hora_fechamento?.slice(0,5) || "18:00";

  return (
    <DashboardLayout title="Dashboard do Gerente" userType="manager">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Visão Geral do Negócio</h1>
            <p className="text-gray-600">Gerencie seu estabelecimento</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <span className="font-medium">Estabelecimento</span>
              <span className={`px-2 py-1 rounded-full text-sm ${estaAberto ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {estaAberto ? "Aberto" : "Fechado"}
              </span>
            </div>
          </div>
        </div>

        {/* Status do Estabelecimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Status do Estabelecimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${estaAberto ? "text-green-600" : "text-red-600"}`}>
                  {estaAberto ? "Aberto" : "Fechado"}
                </div>
                <p className="text-sm text-gray-500">Status atual</p>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {horaAbertura} - {horaFechamento}
                </div>
                <p className="text-sm text-gray-500">Horário de funcionamento</p>
              </div>
              <div className="text-center">
                <Button 
                  onClick={() => navigate('/dashboard/gerente/configuracoes')}
                  variant="outline"
                >
                  Configurar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pedidos Hoje
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                0 pendentes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Hoje
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ 0,00
              </div>
              <p className="text-xs text-muted-foreground">
                +0% em relação a ontem
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Produtos Ativos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Total de produtos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Equipe Ativa
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Funcionários e entregadores
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos</CardTitle>
              <CardDescription>Gerencie pedidos em tempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/dashboard/gerente/pedidos')}
                className="w-full"
              >
                Ver Pedidos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>Gerenciar produtos e categorias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/dashboard/gerente/produtos')}
                  className="w-full"
                >
                  Gerenciar Produtos
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard/gerente/categorias')}
                  variant="outline"
                  className="w-full"
                >
                  Gerenciar Categorias
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipe</CardTitle>
              <CardDescription>Gerenciar funcionários e entregadores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/dashboard/gerente/funcionarios')}
                  className="w-full"
                >
                  Gerenciar Funcionários
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard/gerente/entregadores')}
                  variant="outline"
                  className="w-full"
                >
                  Gerenciar Entregadores
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
