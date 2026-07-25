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
      const pedidos = await apiRequest('/pedidos');
      const entregues = (pedidos || []).filter((pedido: any) => {
        const dia = new Date(pedido.criado_em).toISOString().slice(0, 10);
        return dia === data && pedido.status === 'entregue';
      });
      const novoRelatorio: RelatorioVenda = {
        id: Date.now().toString(),
        data_relatorio: data,
        total_vendas: entregues.reduce((sum: number, pedido: any) => sum + Number(pedido.valor_total), 0),
        total_pedidos: entregues.length,
        criado_em: new Date().toISOString()
      };
      setRelatorios(prev => [novoRelatorio, ...prev]);
      return true;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return false;
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
