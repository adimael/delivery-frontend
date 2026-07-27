import { useState, useEffect } from 'react';
import { categoriasAPI } from '@/lib/api';

export interface CategoriaProduto {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  criado_em: string;
}

const ordenarCategorias = (categorias: CategoriaProduto[]): CategoriaProduto[] => (
  [...categorias].sort((a, b) => (
    Number(a.ordem ?? 0) - Number(b.ordem ?? 0)
    || a.nome.localeCompare(b.nome, 'pt-BR')
  ))
);

export const useCategoriasProduto = (publicas = true) => {
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const data = await categoriasAPI.getAll(publicas);
      setCategorias(ordenarCategorias(data || []));
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarCategoria = async (
    categoria: Omit<CategoriaProduto, 'id' | 'criado_em' | 'ordem'>,
  ) => {
    try {
      const data = await categoriasAPI.create({
        ...categoria,
        ordem: categorias.length === 0
          ? 0
          : Math.max(...categorias.map(item => Number(item.ordem ?? 0))) + 1,
      });
      setCategorias(prev => ordenarCategorias([...prev, data]));
      return { success: true };
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return { success: false, error };
    }
  };

  const atualizarCategoria = async (id: string, updates: Partial<CategoriaProduto>) => {
    try {
      const data = await categoriasAPI.update(id, updates);
      setCategorias(prev => ordenarCategorias(
        prev.map(cat => cat.id === id ? data : cat),
      ));
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

  const reordenarCategorias = async (idsOrdenados: string[]) => {
    const anterior = categorias;
    const ordenadas = idsOrdenados
      .map((id, indice) => {
        const categoria = categorias.find(item => item.id === id);
        return categoria ? { ...categoria, ordem: indice } : null;
      })
      .filter((item): item is CategoriaProduto => item !== null);

    setCategorias(ordenadas);
    try {
      await Promise.all(ordenadas.map((categoria) => (
        categoriasAPI.update(categoria.id, { ordem: categoria.ordem })
      )));
      return { success: true };
    } catch (error) {
      setCategorias(anterior);
      console.error('Erro ao reordenar categorias:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, [publicas]);

  return {
    categorias,
    loading,
    fetchCategorias,
    criarCategoria,
    atualizarCategoria,
    deletarCategoria,
    reordenarCategorias,
  };
};
