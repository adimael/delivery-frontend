import { useState, useEffect } from 'react';
import { categoriasAPI } from '@/lib/api';

export interface CategoriaProduto {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  criado_em: string;
}

export const useCategoriasProduto = () => {
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const data = await categoriasAPI.getAll(true);
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarCategoria = async (categoria: Omit<CategoriaProduto, 'id' | 'criado_em'>) => {
    try {
      const data = await categoriasAPI.create(categoria);
      setCategorias(prev => [...prev, data]);
      return { success: true };
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return { success: false, error };
    }
  };

  const atualizarCategoria = async (id: string, updates: Partial<CategoriaProduto>) => {
    try {
      const data = await categoriasAPI.update(id, updates);
      setCategorias(prev => prev.map(cat => cat.id === id ? data : cat));
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return { success: false, error };
    }
  };

  const deletarCategoria = async (id: string) => {
    try {
      await categoriasAPI.delete(id);
      setCategorias(prev => prev.filter(cat => cat.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  return {
    categorias,
    loading,
    fetchCategorias,
    criarCategoria,
    atualizarCategoria,
    deletarCategoria
  };
};
