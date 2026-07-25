import { useState, useEffect } from 'react';
import { produtosAPI } from '@/lib/api';

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria_id?: string;
  url_imagem?: string;
  imagens?: Array<{ id?: string; url: string; ordem?: number }>;
  disponivel: boolean;
  tempo_preparo?: number;
  criado_em: string;
  atualizado_em: string;
  categorias_opcoes?: Array<{ id: string; nome: string }>;
  variacoes?: unknown[];
}

export const useProdutos = (administrativo = false) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProdutos = async (disponivel?: boolean) => {
    setLoading(true);
    try {
      const data = await (administrativo
        ? produtosAPI.getAllAdmin()
        : produtosAPI.getAll());
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  const criarProduto = async (produto: Omit<Produto, 'id' | 'criado_em' | 'atualizado_em'>) => {
    try {
      const data = await produtosAPI.create(produto);
      setProdutos(prev => [...prev, data]);
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      return { success: false, error };
    }
  };

  const atualizarProduto = async (id: string, updates: Partial<Produto>) => {
    try {
      const data = await produtosAPI.update(id, updates);
      setProdutos(prev => prev.map(prod => prod.id === id ? data : prod));
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return { success: false, error };
    }
  };

  const deletarProduto = async (id: string) => {
    try {
      await produtosAPI.delete(id);
      setProdutos(prev => prev.filter(prod => prod.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, [administrativo]);

  return {
    produtos,
    loading,
    fetchProdutos,
    criarProduto,
    atualizarProduto,
    deletarProduto
  };
}; 
