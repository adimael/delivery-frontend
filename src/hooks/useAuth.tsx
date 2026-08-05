import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ApiError, apiRequest, authAPI, ensureFreshSession } from '@/lib/api';

export type TipoUsuario = 'cliente' | 'funcionario' | 'entregador' | 'gerente';

export interface UserProfile {
  id: string;
  uuid?: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  tipo_usuario: TipoUsuario;
  ativo: boolean;
  status_aprovacao?: 'pendente' | 'aprovado' | 'rejeitado';
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, nomeCompleto: string, tipoUsuario?: 'cliente' | 'entregador') => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (credential: string, papel: 'cliente' | 'entregador') => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const normalizeProfile = (profile: any): UserProfile => ({
  ...profile,
  id: profile.id ?? profile.uuid,
  tipo_usuario: profile.tipo_usuario ?? profile.papel ?? profile.role ?? 'cliente',
  ativo: profile.ativo !== false && profile.ativo !== 0,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (!token && !refreshToken) {
        setLoading(false);
        return;
      }
      try {
        const sessionReady = await ensureFreshSession();
        if (!sessionReady) {
          throw new Error('Sessão expirada.');
        }
        const profile = normalizeProfile(await authAPI.getProfile());
        localStorage.setItem('user', JSON.stringify(profile));
        setUser(profile);
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    void restore();
  }, []);

  useEffect(() => {
    const keepAlive = () => {
      if (localStorage.getItem('refreshToken')) void ensureFreshSession();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') keepAlive();
    };
    const handleExpired = () => setUser(null);
    const interval = window.setInterval(keepAlive, 60_000);
    window.addEventListener('focus', keepAlive);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('delivery:session-expired', handleExpired);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', keepAlive);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('delivery:session-expired', handleExpired);
    };
  }, []);

  const persistSession = (data: any) => {
    const token = data.access_token ?? data.token;
    const refreshToken = data.refresh_token;
    const rawProfile = data.usuario ?? data.user ?? data.perfil;
    if (!token || !rawProfile) throw new Error('Resposta de autenticação inválida.');
    const profile = normalizeProfile(rawProfile);
    localStorage.setItem('authToken', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
  };

  const signUp = async (email: string, password: string, nomeCompleto: string, tipoUsuario: 'cliente' | 'entregador' = 'cliente') => {
    try {
      try {
        await authAPI.signup({
          email,
          password,
          senha: password,
          nome_completo: nomeCompleto,
          tipo_usuario: tipoUsuario,
        });
      } catch (error) {
        // A conta pode ter sido criada numa tentativa anterior cujo login
        // automático falhou. As credenciais ainda serão confirmadas abaixo.
        if (!(error instanceof ApiError) || error.status !== 409) throw error;
      }
      if (tipoUsuario === 'entregador') {
        return { success: true, pendingApproval: true };
      }
      const data = await authAPI.signin({
        email,
        password,
        senha: password,
        manter_sessao: true,
      });
      persistSession(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao criar conta.' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authAPI.signin({
        email,
        password,
        senha: password,
        manter_sessao: true,
      });
      persistSession(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'E-mail ou senha incorretos.' };
    }
  };

  const signInWithGoogle = async (credential: string, papel: 'cliente' | 'entregador') => {
    try {
      const data = await authAPI.google(credential, papel);
      persistSession(data);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível entrar com o Google.';
      return {
        success: false,
        error: message,
        pendingApproval: papel === 'entregador' && /aguardando aprova/i.test(message),
      };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao solicitar recuperação.' };
    }
  };

  const updatePassword = async (password: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword: password, nova_senha: password }),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao atualizar senha.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
