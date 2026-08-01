import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export interface CategoriaOpcao {
  id: string;
  produto_uuid?: string;
  nome: string;
  descricao?: string;
  minimo: number;
  maximo: number;
  tipo_selecao?: 'unica' | 'multipla' | 'quantidade';
  maximo_por_opcao?: number;
  mostrar_preco: boolean;
  ordem: number;
  criado_em: string;
}

export interface OpcaoProduto {
  id: string;
  nome: string;
  preco_adicional: number;
  categoria_id: string;
  disponivel: boolean;
  ordem: number;
  produto_adicional_uuid?: string | null;
  produto_adicional_nome?: string | null;
  criado_em: string;
}

export interface ProdutoOpcaoCompleta {
  categoria_id: string;
  categoria_nome: string;
  categoria_descricao?: string;
  categoria_minimo: number;
  categoria_maximo: number;
  categoria_tipo_selecao?: 'unica' | 'multipla' | 'quantidade';
  categoria_maximo_por_opcao?: number;
  categoria_mostrar_preco?: boolean;
  categoria_ordem?: number;
  opcao_id?: string;
  opcao_nome?: string;
  opcao_preco_adicional?: number;
  opcao_disponivel?: boolean;
  opcao_ordem?: number;
  opcao_produto_adicional_id?: string | null;
  opcao_produto_adicional_nome?: string | null;
}

const numero = (valor: unknown, fallback = 0): number => {
  const convertido = typeof valor === 'number'
    ? valor
    : Number.parseFloat(String(valor ?? '').replace(',', '.'));
  return Number.isFinite(convertido) ? convertido : fallback;
};

const booleano = (valor: unknown): boolean =>
  valor === true || valor === 1 || valor === '1' || valor === 'true';

const normalizarCategoria = (categoria: any): CategoriaOpcao => ({
  ...categoria,
  id: String(categoria.id ?? categoria.uuid ?? ''),
  minimo: numero(categoria.minimo),
  maximo: numero(categoria.maximo, 1),
  maximo_por_opcao: numero(categoria.maximo_por_opcao, 1),
  mostrar_preco: booleano(categoria.mostrar_preco),
  ordem: numero(categoria.ordem),
});

const normalizarOpcao = (opcao: any, categoriaId?: string): OpcaoProduto => ({
  ...opcao,
  id: String(opcao.id ?? opcao.uuid ?? ''),
  categoria_id: String(opcao.categoria_id ?? opcao.categoria_uuid ?? categoriaId ?? ''),
  preco_adicional: numero(opcao.preco_adicional),
  disponivel: booleano(opcao.disponivel),
  ordem: numero(opcao.ordem),
});

const normalizarVinculo = (item: any): ProdutoOpcaoCompleta => ({
  ...item,
  categoria_id: String(item.categoria_id ?? item.categoria_uuid ?? ''),
  categoria_minimo: numero(item.categoria_minimo),
  categoria_maximo: numero(item.categoria_maximo, 1),
  categoria_maximo_por_opcao: numero(item.categoria_maximo_por_opcao, 1),
  categoria_mostrar_preco: booleano(item.categoria_mostrar_preco),
  categoria_ordem: numero(item.categoria_ordem),
  opcao_preco_adicional: numero(item.opcao_preco_adicional),
  opcao_disponivel: booleano(item.opcao_disponivel),
  opcao_ordem: numero(item.opcao_ordem),
});

export const useProductOptions = ({
  loadAdminData = true,
  productId,
}: {
  loadAdminData?: boolean;
  productId?: string;
} = {}) => {
  const [categorias, setCategorias] = useState<CategoriaOpcao[]>([]);
  const [opcoes, setOpcoes] = useState<OpcaoProduto[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDadosProduto = async () => {
    if (!productId) {
      setCategorias([]);
      setOpcoes([]);
      return;
    }

    const data = await apiRequest(
      `/admin/opcoes/categorias?produto_uuid=${encodeURIComponent(productId)}`,
    );
    const categoriasAdmin = Array.isArray(data) ? data : [];
    const vinculos = categoriasAdmin.flatMap((categoria: any) => {
      const categoriaNormalizada = normalizarCategoria(categoria);
      const opcoesCategoria = Array.isArray(categoria.opcoes) ? categoria.opcoes : [];

      if (opcoesCategoria.length === 0) {
        return [{
          categoria_id: categoriaNormalizada.id,
          categoria_nome: categoriaNormalizada.nome,
          categoria_descricao: categoriaNormalizada.descricao,
          categoria_minimo: categoriaNormalizada.minimo,
          categoria_maximo: categoriaNormalizada.maximo,
          categoria_tipo_selecao: categoriaNormalizada.tipo_selecao,
          categoria_maximo_por_opcao: categoriaNormalizada.maximo_por_opcao,
          categoria_mostrar_preco: categoriaNormalizada.mostrar_preco,
          categoria_ordem: categoriaNormalizada.ordem,
        } as ProdutoOpcaoCompleta];
      }

      return opcoesCategoria.map((opcao: any) => {
        const opcaoNormalizada = normalizarOpcao(opcao, categoriaNormalizada.id);
        return {
          categoria_id: categoriaNormalizada.id,
          categoria_nome: categoriaNormalizada.nome,
          categoria_descricao: categoriaNormalizada.descricao,
          categoria_minimo: categoriaNormalizada.minimo,
          categoria_maximo: categoriaNormalizada.maximo,
          categoria_tipo_selecao: categoriaNormalizada.tipo_selecao,
          categoria_maximo_por_opcao: categoriaNormalizada.maximo_por_opcao,
          categoria_mostrar_preco: categoriaNormalizada.mostrar_preco,
          categoria_ordem: categoriaNormalizada.ordem,
          opcao_id: opcaoNormalizada.id,
          opcao_nome: opcaoNormalizada.nome,
          opcao_preco_adicional: opcaoNormalizada.preco_adicional,
          opcao_disponivel: opcaoNormalizada.disponivel,
          opcao_ordem: opcaoNormalizada.ordem,
          opcao_produto_adicional_id: opcaoNormalizada.produto_adicional_uuid,
          opcao_produto_adicional_nome: opcaoNormalizada.produto_adicional_nome,
        } as ProdutoOpcaoCompleta;
      });
    });
    const categoriasUnicas = new Map<string, CategoriaOpcao>();
    const opcoesProduto: OpcaoProduto[] = [];

    vinculos.forEach((item) => {
      if (!categoriasUnicas.has(item.categoria_id)) {
        categoriasUnicas.set(item.categoria_id, normalizarCategoria({
          id: item.categoria_id,
          produto_uuid: productId,
          nome: item.categoria_nome,
          descricao: item.categoria_descricao,
          minimo: item.categoria_minimo,
          maximo: item.categoria_maximo,
          tipo_selecao: item.categoria_tipo_selecao,
          maximo_por_opcao: item.categoria_maximo_por_opcao,
          mostrar_preco: item.categoria_mostrar_preco,
          ordem: item.categoria_ordem,
          criado_em: '',
        }));
      }
      if (item.opcao_id) {
        opcoesProduto.push(normalizarOpcao({
          id: item.opcao_id,
          categoria_id: item.categoria_id,
          nome: item.opcao_nome,
          preco_adicional: item.opcao_preco_adicional,
          disponivel: item.opcao_disponivel,
          ordem: item.opcao_ordem,
          produto_adicional_uuid: item.opcao_produto_adicional_id,
          produto_adicional_nome: item.opcao_produto_adicional_nome,
          criado_em: '',
        }));
      }
    });

    setCategorias(
      Array.from(categoriasUnicas.values()).sort(
        (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome),
      ),
    );
    setOpcoes(opcoesProduto.sort(
      (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome),
    ));
  };

  const refetch = async () => {
    setLoading(true);
    try {
      await carregarDadosProduto();
    } catch {
      setCategorias([]);
      setOpcoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadAdminData) {
      void refetch();
      return;
    }
    setLoading(false);
  }, [loadAdminData, productId]);

  const getOpcoesParaProduto = async (produtoId: string): Promise<ProdutoOpcaoCompleta[]> => {
    const data = await apiRequest(`/produtos/${produtoId}/opcoes`);
    return Array.isArray(data) ? data.map(normalizarVinculo) : [];
  };

  const criarCategoria = async (categoria: Omit<CategoriaOpcao, 'id' | 'criado_em'>) => {
    if (!productId) {
      throw new Error('Produto não identificado.');
    }
    const data = await apiRequest('/admin/opcoes/categorias', {
      method: 'POST', body: JSON.stringify({ ...categoria, produto_uuid: productId })
    });
    const normalizada = normalizarCategoria(data);
    setCategorias(prev => [...prev, normalizada]);
    return normalizada;
  };

  const atualizarCategoria = async (id: string, categoria: Partial<CategoriaOpcao>) => {
    const data = await apiRequest(`/admin/opcoes/categorias/${id}`, {
      method: 'PATCH', body: JSON.stringify(categoria)
    });
    const normalizada = normalizarCategoria(data);
    setCategorias(prev => prev.map(item => item.id === id ? normalizada : item));
    return normalizada;
  };

  const excluirCategoria = async (id: string) => {
    await apiRequest(`/admin/opcoes/categorias/${id}`, { method: 'DELETE' });
    setCategorias(prev => prev.filter(item => item.id !== id));
    setOpcoes(prev => prev.filter(item => item.categoria_id !== id));
    return true;
  };

  const criarOpcao = async (opcao: Omit<OpcaoProduto, 'id' | 'criado_em'>) => {
    const payload = {
      ...opcao,
      categoria_uuid: opcao.categoria_uuid || opcao.categoria_id,
      produto_adicional_uuid: opcao.produto_adicional_uuid || null,
    };
    const data = await apiRequest('/admin/opcoes', {
      method: 'POST', body: JSON.stringify(payload)
    });
    const normalizada = normalizarOpcao(data);
    setOpcoes(prev => [...prev, normalizada]);
    return normalizada;
  };

  const atualizarOpcao = async (id: string, opcao: Partial<OpcaoProduto>) => {
    const payload = {
      ...opcao,
      ...(opcao.categoria_uuid || opcao.categoria_id
        ? { categoria_uuid: opcao.categoria_uuid || opcao.categoria_id }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(opcao, 'produto_adicional_uuid')
        ? { produto_adicional_uuid: opcao.produto_adicional_uuid || null }
        : {}),
    };
    const data = await apiRequest(`/admin/opcoes/${id}`, {
      method: 'PATCH', body: JSON.stringify(payload)
    });
    const normalizada = normalizarOpcao(data);
    setOpcoes(prev => prev.map(item => item.id === id ? normalizada : item));
    return normalizada;
  };

  const excluirOpcao = async (id: string) => {
    await apiRequest(`/admin/opcoes/${id}`, { method: 'DELETE' });
    setOpcoes(prev => prev.filter(item => item.id !== id));
    return true;
  };

  const reordenarCategorias = async (idsOrdenados: string[]) => {
    const posicoes = new Map(idsOrdenados.map((id, indice) => [id, indice + 1]));
    setCategorias(prev => prev
      .map(item => ({ ...item, ordem: posicoes.get(item.id) ?? item.ordem }))
      .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)));

    try {
      await Promise.all(idsOrdenados.map((id, indice) =>
        apiRequest(`/admin/opcoes/categorias/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ ordem: indice + 1 }),
        }),
      ));
    } catch (error) {
      await refetch();
      throw error;
    }
  };

  const reordenarOpcoes = async (categoriaId: string, idsOrdenados: string[]) => {
    const posicoes = new Map(idsOrdenados.map((id, indice) => [id, indice + 1]));
    setOpcoes(prev => {
      const atualizadas = prev.map(item =>
        item.categoria_id === categoriaId
          ? { ...item, ordem: posicoes.get(item.id) ?? item.ordem }
          : item,
      );
      const ordemCategorias = new Map(categorias.map((item, indice) => [item.id, indice]));
      return atualizadas.sort((a, b) =>
        (ordemCategorias.get(a.categoria_id) ?? 9999)
          - (ordemCategorias.get(b.categoria_id) ?? 9999)
        || a.ordem - b.ordem
        || a.nome.localeCompare(b.nome),
      );
    });

    try {
      await Promise.all(idsOrdenados.map((id, indice) =>
        apiRequest(`/admin/opcoes/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ ordem: indice + 1 }),
        }),
      ));
    } catch (error) {
      await refetch();
      throw error;
    }
  };

  const vincularCategoriaAoProduto = (produtoId: string, categoriaId: string) =>
    apiRequest(`/admin/produtos/${produtoId}/opcoes/${categoriaId}`, { method: 'POST' });

  const desvincularCategoriaAoProduto = async (produtoId: string, categoriaId: string) => {
    await apiRequest(`/admin/produtos/${produtoId}/opcoes/${categoriaId}`, { method: 'DELETE' });
    return true;
  };

  const reordenarCategoriasVinculadas = (produtoId: string, categorias: string[]) =>
    apiRequest(`/admin/produtos/${produtoId}/opcoes/ordem`, {
      method: 'PATCH',
      body: JSON.stringify({ categorias }),
    });

  return {
    categorias, opcoes, loading, getOpcoesParaProduto, criarCategoria,
    atualizarCategoria, excluirCategoria, criarOpcao, atualizarOpcao,
    excluirOpcao, vincularCategoriaAoProduto, desvincularCategoriaAoProduto,
    reordenarCategorias, reordenarOpcoes, reordenarCategoriasVinculadas, refetch
  };
};
