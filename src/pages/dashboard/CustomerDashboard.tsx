import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, User, HelpCircle } from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Dashboard do Cliente" userType="customer">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold">Bem-vindo(a), {user?.nome_completo || 'Cliente'}!</h1>
          <p className="text-gray-600 mt-2">Aqui você pode gerenciar seus pedidos e informações.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/dashboard/cliente/pedidos')}
          >
            <div className="flex items-center mb-2">
              <ShoppingCart className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="text-lg font-semibold">Meus Pedidos</h3>
            </div>
            <p className="text-gray-600">Acompanhe o status dos seus pedidos</p>
          </div>

          <div 
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/dashboard/cliente/perfil')}
          >
            <div className="flex items-center mb-2">
              <User className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="text-lg font-semibold">Meu Perfil</h3>
            </div>
            <p className="text-gray-600">Atualize suas informações pessoais</p>
          </div>

          <div 
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/dashboard/cliente/chat')}
          >
            <div className="flex items-center mb-2">
              <HelpCircle className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="text-lg font-semibold">Suporte</h3>
            </div>
            <p className="text-gray-600">Entre em contato conosco</p>
          </div>

          <div 
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center mb-2">
              <Home className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="text-lg font-semibold">Página Inicial</h3>
            </div>
            <p className="text-gray-600">Voltar para a página principal</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;