import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export type StaffTipo = 'funcionario' | 'entregador' | 'gerente';

export interface StaffMember {
  id: string;
  nome_completo: string;
  telefone: string;
  email: string;
  tipo_usuario: StaffTipo;
  ativo: boolean;
  status_aprovacao?: 'pendente' | 'aprovado' | 'rejeitado';
  criado_em: string;
  atualizado_em: string;
}

// Tipo parcial recebido da API (pode ter campos opcionais)
export type ApiStaff = Partial<{
  id: string;
  nome_completo: string;
  telefone: string;
  tipo_usuario: StaffTipo;
  ativo: boolean;
  status_aprovacao: 'pendente' | 'aprovado' | 'rejeitado';
  criado_em: string;
  atualizado_em: string;
  email: string;
}>;

export const useStaff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    try {
      
      const data = await apiRequest('/perfis?tipo_usuario=funcionario,entregador,gerente');

      
      // Filter and map the data to ensure type safety
      const items = (data || []) as ApiStaff[];
      const filteredStaff = items
        .filter((member) =>
          member.tipo_usuario === 'funcionario' ||
          member.tipo_usuario === 'entregador' ||
          member.tipo_usuario === 'gerente'
        )
        .map((member) => ({
          id: String(member.id ?? ''),
          nome_completo: String(member.nome_completo ?? ''),
          telefone: String(member.telefone ?? ''),
          email: String(member.email ?? ''),
          tipo_usuario: (member.tipo_usuario as StaffTipo) || 'funcionario',
          ativo: Boolean(member.ativo),
          status_aprovacao: member.status_aprovacao || (member.ativo ? 'aprovado' : 'pendente'),
          criado_em: String(member.criado_em ?? new Date().toISOString()),
          atualizado_em: String(member.atualizado_em ?? new Date().toISOString())
        }));

      setStaff(filteredStaff);
    } catch (error) {
      console.error('Erro ao buscar staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStaff = async (staffData: { 
    nome_completo: string; 
    telefone: string; 
    tipo_usuario: StaffTipo; 
    email: string; 
    senha?: string;
    acesso_google?: boolean;
  }) => {
    try {

      await apiRequest('/equipe', {
        method: 'POST',
        body: JSON.stringify({
          nome_completo: staffData.nome_completo,
          telefone: staffData.telefone,
          tipo_usuario: staffData.tipo_usuario,
          email: staffData.email,
          acesso_google: staffData.acesso_google === true,
          ...(staffData.acesso_google ? {} : {
            password: staffData.senha,
            senha: staffData.senha,
          }),
        }),
      });

      await fetchStaff(); // Refresh the staff list
      return { success: true };
    } catch (error) {
      console.error('Erro ao criar membro da equipe:', error);
      return { success: false, error };
    }
  };

  const updateStaff = async (id: string, updates: Partial<Omit<StaffMember, 'id' | 'criado_em'>>) => {
    try {
      await apiRequest(`/perfis/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...updates,
          atualizado_em: new Date().toISOString()
        }),
      });

      await fetchStaff(); // Refresh the staff list
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar membro da equipe:', error);
      return { success: false, error };
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      await apiRequest(`/perfis/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: false }),
      });

      setStaff(prev => prev.filter(member => member.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Erro ao desativar membro da equipe:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return {
    staff,
    loading,
    fetchStaff,
    criarFuncionario: createStaff,
    atualizarFuncionario: updateStaff,
    excluirFuncionario: deleteStaff
  };
};
