import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export interface ProductVariation {
  id: string;
  produto_id: string;
  tipo_variacao: string;
  nome: string;
  preco_adicional: number;
  estoque: number;
  disponivel: boolean;
  criado_em: string;
  atualizado_em: string;
}

export const useProductVariations = ({ loadAdminData = true }: { loadAdminData?: boolean } = {}) => {
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loadAdminData) {
      void fetchVariations();
      return;
    }
    setLoading(false);
  }, [loadAdminData]);

  const fetchVariations = async () => {
    try {
      setLoading(true);
      const produtos = await apiRequest('/admin/produtos');
      const data = produtos.flatMap((produto: any) =>
        (produto.variacoes ?? []).map((variacao: any) => ({
          ...variacao,
          produto_id: variacao.produto_id ?? variacao.produto_uuid ?? produto.id ?? produto.uuid,
        })),
      );
      // Normalizar os campos para garantir tipos corretos
      const normalized = Array.isArray(data) ? data.map(v => ({
        ...v,
        preco_adicional: typeof v.preco_adicional === 'string' ? parseFloat(v.preco_adicional) : v.preco_adicional,
        disponivel: v.disponivel === true || v.disponivel === 1 || v.disponivel === '1',
        estoque: typeof v.estoque === 'string' ? parseInt(v.estoque) : v.estoque,
      })) : [];
      setVariations(normalized);
    } catch (error) {
      console.error('Erro ao buscar variações:', error);
      setVariations([]);
    } finally {
      setLoading(false);
    }
  };

  const getVariationsByProduct = (productId: string) => {
    return variations.filter(v => v.produto_id === productId);
  };

  const getVariationsByType = (productId: string, type: string) => {
    return variations.filter(v => v.produto_id === productId && v.tipo_variacao === type);
  };

  // Busca variações diretamente do backend para um produto específico
  const getVariationsByProductAsync = async (productId: string) => {
    try {
      const data = await apiRequest(`/produtos/${productId}/variacoes`);
      // Normalizar os campos para garantir tipos corretos
      return Array.isArray(data) ? data.map(v => ({
        ...v,
        produto_id: v.produto_id || v.produto_uuid,
        preco_adicional: typeof v.preco_adicional === 'string' ? parseFloat(v.preco_adicional) : v.preco_adicional,
        disponivel: v.disponivel === true || v.disponivel === 1 || v.disponivel === '1',
        estoque: typeof v.estoque === 'string' ? parseInt(v.estoque) : v.estoque,
      })) : [];
    } catch (error) {
      console.error('Erro ao buscar variações do produto:', error);
      return [];
    }
  };

  const createVariation = async (variation: Omit<ProductVariation, 'id' | 'criado_em' | 'atualizado_em'>) => {
    try {
      const data = await apiRequest('/admin/variacoes', {
        method: 'POST',
        body: JSON.stringify(variation),
      });
      await fetchVariations(); // Recarregar lista
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar variação:', error);
      return { success: false, error: 'Erro ao criar variação' };
    }
  };

  const updateVariation = async (id: string, updates: Partial<ProductVariation>) => {
    try {
      const data = await apiRequest(`/admin/variacoes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      await fetchVariations(); // Recarregar lista
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao atualizar variação:', error);
      return { success: false, error: 'Erro ao atualizar variação' };
    }
  };

  const deleteVariation = async (id: string) => {
    try {
      await apiRequest(`/admin/variacoes/${id}`, {
        method: 'DELETE',
      });
      await fetchVariations(); // Recarregar lista
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar variação:', error);
      return { success: false, error: 'Erro ao deletar variação' };
    }
  };

  const createBulkVariations = async (productId: string, type: string, names: string[]) => {
    try {
      const data = await apiRequest(`/admin/produtos/${productId}/variacoes`, {
        method: 'PUT',
        body: JSON.stringify({
          tipo_variacao: type,
          variacoes: names.map(nome => ({ nome, tipo_variacao: type }))
        }),
      });
      await fetchVariations(); // Recarregar lista
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar variações em lote:', error);
      return { success: false, error: 'Erro ao criar variações em lote' };
    }
  };

  return {
    variations,
    loading,
    getVariationsByProduct,
    getVariationsByType,
    createVariation,
    updateVariation,
    deleteVariation,
    createBulkVariations,
    refetch: fetchVariations
    ,getVariationsByProductAsync
  };
};
