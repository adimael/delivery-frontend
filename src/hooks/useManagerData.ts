import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface RelatorioVenda {
  id: string;
  data_relatorio: string;
  total_vendas: number;
  total_pedidos: number;
  produto_mais_vendido?: string;
  criado_em: string;
  fuso_horario: string;
  pedidos_entregues: number;
  valor_pedidos_validos: number;
  total_descontos: number;
  total_taxas_entrega: number;
  ticket_medio: number;
  status: Record<string, number>;
  formas_pagamento: Record<string, number>;
  tipos_entrega: Record<string, number>;
  produtos: Array<{ nome: string; quantidade: number; valor: number }>;
  pedidos: any[];
}

export interface FuncionarioData {
  id: string;
  nome_completo: string;
  telefone?: string;
  tipo_usuario: 'funcionario' | 'entregador' | 'gerente';
  ativo: boolean;
  criado_em: string;
}

export const useManagerData = () => {
  const [relatorios, setRelatorios] = useState<RelatorioVenda[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFuncionarios = async () => {
    try {
      const data = await apiRequest('/perfis');
      setFuncionarios((data || [])
        .filter((item: any) => item.tipo_usuario !== 'cliente')
        .map((item: any) => ({
          id: item.id,
          nome_completo: item.nome_completo || '',
          telefone: item.telefone || undefined,
          tipo_usuario: item.tipo_usuario,
          ativo: Boolean(item.ativo),
          criado_em: item.criado_em || ''
        })));
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      setFuncionarios([]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await fetchFuncionarios();
    setLoading(false);
  };

  useEffect(() => {
    if (user?.tipo_usuario === 'gerente') void fetchAllData();
  }, [user?.id, user?.tipo_usuario]);

  const gerarRelatorio = async (data: string) => {
    try {
      const novoRelatorio = await apiRequest(
        `/relatorios/resumo?data=${encodeURIComponent(data)}`,
      ) as RelatorioVenda;
      setRelatorios(prev => [
        novoRelatorio,
        ...prev.filter(item => item.data_relatorio !== novoRelatorio.data_relatorio),
      ]);
      return novoRelatorio;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return null;
    }
  };

  const atualizarFuncionario = async (id: string, dados: Partial<FuncionarioData>) => {
    try {
      const atual = funcionarios.find(item => item.id === id);
      await apiRequest(`/perfis/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...atual, ...dados })
      });
      await fetchFuncionarios();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      return false;
    }
  };

  return {
    relatorios, funcionarios, loading, gerarRelatorio,
    atualizarFuncionario, refetch: fetchAllData
  };
};
