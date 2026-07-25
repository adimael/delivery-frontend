import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    // Redirecionar baseado no tipo de usuário
    if (user.tipo_usuario === 'cliente') {
      // Clientes vão para a página principal
      navigate('/', { replace: true });
    } else {
      // Outros tipos de usuário vão para seus dashboards específicos
      const dashboardMapping = {
        'funcionario': '/dashboard/funcionario',
        'entregador': '/dashboard/entregador',
        'gerente': '/dashboard/gerente'
      };

      const dashboardPath = dashboardMapping[user.tipo_usuario];
      if (dashboardPath) {
        navigate(dashboardPath, { replace: true });
      } else {
        // Fallback para página principal se tipo não reconhecido
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Mostrar loading enquanto redireciona
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kumekume-orange mx-auto"></div>
        <p className="mt-4 text-gray-600 text-lg">Redirecionando...</p>
      </div>
    </div>
  );
};
