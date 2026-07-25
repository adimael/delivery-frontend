import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, TipoUsuario } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  tiposPermitidos?: TipoUsuario[];
  redirecionarPara?: string;
}

export const ProtectedRoute = ({ 
  children, 
  tiposPermitidos = [], 
  redirecionarPara = '/login' 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const temPermissao = Boolean(
    user
    && (
      tiposPermitidos.length === 0
      || tiposPermitidos.includes(user.tipo_usuario)
    ),
  );

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate(redirecionarPara, { replace: true });
      return;
    }

    if (!temPermissao) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta área.",
        variant: "destructive",
      });
      
      const dashboardPath = getDashboardPathByUserType(user.tipo_usuario);
      navigate(dashboardPath, { replace: true });
    }
  }, [
    user,
    loading,
    navigate,
    redirecionarPara,
    toast,
    temPermissao,
  ]);

  const getDashboardPathByUserType = (tipo: TipoUsuario): string => {
    const dashboardMapping = {
      'cliente': '/dashboard/cliente',
      'funcionario': '/dashboard/funcionario',
      'entregador': '/dashboard/entregador',
      'gerente': '/dashboard/gerente'
    };
    return dashboardMapping[tipo] || '/dashboard/cliente';
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kumekume-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, não mostrar conteúdo
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kumekume-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se tipos são especificados e usuário não tem permissão, não mostrar conteúdo
  if (!temPermissao) {
    return null;
  }

  return <>{children}</>;
};
