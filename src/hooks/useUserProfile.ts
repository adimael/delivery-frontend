import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authAPI, perfisAPI } from '@/lib/api';
import { enderecosAPI } from '@/lib/api';

export interface UserProfile {
  id: string;
  nome_completo: string;
  email?: string;
  telefone?: string;
  tipo_usuario: 'cliente' | 'funcionario' | 'entregador' | 'gerente';
  ativo: boolean;
  possui_senha?: boolean;
  google_vinculado?: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Endereco {
  id: string;
  nome_endereco: string;
  endereco_completo: string;
  cep?: string;
  cidade: string;
  estado?: string;
  bairro?: string;
  numero?: string;
  complemento?: string;
  ponto_referencia?: string;
  principal: boolean;
  criado_em: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnderecos, setLoadingEnderecos] = useState(false);
  const { user, updateSessionProfile } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setProfile((current) => current ?? ({
        ...user,
        criado_em: '',
        atualizado_em: '',
      } as UserProfile));
      try {
        const data = await authAPI.getProfile();
        setProfile({
          ...data,
          id: data.id ?? data.uuid ?? user.id,
          criado_em: data.criado_em ?? '',
          atualizado_em: data.atualizado_em ?? '',
        });
      } catch (error) {
        // Mantém os dados seguros já recebidos no login em falhas transitórias.
      }
      setLoading(false);
    };

    fetchProfile();
    if (user) {
      fetchEnderecos();
    }
  }, [user]);

  const fetchEnderecos = async () => {
    if (!user) return;
    setLoadingEnderecos(true);
    try {
      const data = await enderecosAPI.getEnderecos(user.id);
      setEnderecos(data || []);
    } catch (error) {
      setEnderecos([]);
    }
    setLoadingEnderecos(false);
  };

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'criado_em' | 'atualizado_em' | 'email'>>) => {
    if (!user || !profile) return false;

    try {
      const response = await authAPI.updateProfile(updates);

      setProfile(prev => prev ? {
        ...prev,
        ...updates,
        ...response,
        id: response?.id ?? response?.uuid ?? prev.id,
        atualizado_em: response?.atualizado_em ?? new Date().toISOString(),
      } : prev);
      updateSessionProfile({ ...updates, ...response });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return false;
    
    try {
      const response = await perfisAPI.updatePassword(user.id, newPassword);

      if (response.error) {
        console.error('Erro ao atualizar senha:', response.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      return false;
    }
  };

  const addEndereco = async (endereco: Omit<Endereco, 'id' | 'criado_em'>) => {
    if (!user) return false;
    try {
      const isPrimeiro = enderecos.length === 0;
      const novoPrincipal = isPrimeiro || endereco.principal;
      const payload = { ...endereco, principal: novoPrincipal };
      await enderecosAPI.addEndereco(payload);
      await fetchEnderecos();
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateEndereco = async (id: string, updates: Partial<Omit<Endereco, 'id' | 'criado_em'>>) => {
    if (!user) return false;
    try {
      await enderecosAPI.updateEndereco(id, updates);
      await fetchEnderecos();
      return true;
    } catch (error) {
      return false;
    }
  };

  const deleteEndereco = async (id: string) => {
    if (!user) return false;
    try {
      await enderecosAPI.deleteEndereco(id);
      await fetchEnderecos();
      return true;
    } catch (error) {
      return false;
    }
  };

  const setEnderecoPrincipal = async (id: string) => {
    if (!user) return false;
    try {
      await enderecosAPI.updateEndereco(id, { principal: true });
      await fetchEnderecos();
      return true;
    } catch (error) {
      return false;
    }
  };

  return { 
    profile, 
    enderecos, 
    loading, 
    loadingEnderecos,
    updateProfile, 
    updatePassword,
    addEndereco,
    updateEndereco,
    deleteEndereco,
    setEnderecoPrincipal,
    fetchEnderecos
  };
};
