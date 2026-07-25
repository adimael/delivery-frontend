import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProdutos } from "@/hooks/useProdutos";
import { useCategoriasProduto } from "@/hooks/useCategoriasProduto";
import { Plus, Edit, Trash2, Settings, Sliders } from "lucide-react";
import ProductFormModal from "@/components/manager/ProductFormModal";
import ProductOptionsModal from "@/components/manager/ProductOptionsModal";
import ProductVariationsModal from "@/components/manager/ProductVariationsModal";
import { useToast } from "@/hooks/use-toast";
import { confirmAction } from "@/components/ui/confirmation-host";
import { produtosAPI } from "@/lib/api";

const ManagerProducts = () => {
  const { produtos, loading, deletarProduto, fetchProdutos } = useProdutos(true);
  const { categorias } = useCategoriasProduto();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showVariationsModal, setShowVariationsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState<{id: string, nome: string} | null>(null);

  const getCategoriaLabel = (produto: any) => {
    if (produto.categoria_id) {
      const categoria = categorias.find(cat => cat.id === produto.categoria_id);
      return categoria?.nome || 'Categoria não encontrada';
    }
    return 'Sem categoria';
  };

  const handleEdit = (produto: any) => {
    setEditingProduct(produto);
    setShowModal(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleCloseModal = (open: boolean) => {
    setShowModal(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  const handleManageOptions = (produto: any) => {
    setSelectedProduct({ id: produto.id, nome: produto.nome });
    setShowOptionsModal(true);
  };

  const handleManageVariations = (produto: any) => {
    setSelectedProduct({ id: produto.id, nome: produto.nome });
    setShowVariationsModal(true);
  };

  const handleCloseOptionsModal = (open: boolean) => {
    setShowOptionsModal(open);
    if (!open) {
      setSelectedProduct(null);
    }
  };

  const handleCloseVariationsModal = (open: boolean) => {
    setShowVariationsModal(open);
    if (!open) {
      setSelectedProduct(null);
    }
  };

  const handleDelete = async (produtoId: string) => {
    if (!(await confirmAction({
      title: 'Excluir produto?',
      description: 'O produto será removido do cardápio e esta ação não poderá ser desfeita.',
    }))) return;

    try {
      const result = await deletarProduto(produtoId);
      
      if (result.success) {
        toast({
          title: "Produto excluído",
          description: "O produto foi excluído com sucesso.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o produto.",
        variant: "destructive",
      });
    }
  };

  const handleModalSuccess = () => {
    fetchProdutos();
  };

  if (loading) {
    return (
      <DashboardLayout title="Produtos" userType="manager">
        <div>Carregando produtos...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Produtos" userType="manager">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
          <Button onClick={handleNewProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {produtos.map((produto) => (
            <Card key={produto.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{produto.nome}</CardTitle>
                  <Badge variant={produto.disponivel ? "default" : "secondary"}>
                    {produto.disponivel ? "Disponível" : "Indisponível"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {produto.url_imagem && (
                    <img 
                      src={produto.url_imagem} 
                      alt={produto.nome}
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                  
                  <p className="text-sm text-gray-600">{produto.descricao}</p>
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">
                      {getCategoriaLabel(produto)}
                    </Badge>
                    <span className="font-semibold text-lg">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(produto)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleManageOptions(produto)}
                    >
                      <Settings className="mr-1 h-3 w-3" />
                      Opções
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleManageVariations(produto)}
                    >
                      <Sliders className="mr-1 h-3 w-3" />
                      Variações
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(produto.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <ProductFormModal
          open={showModal}
          onOpenChange={handleCloseModal}
          produto={editingProduct}
          onSuccess={handleModalSuccess}
        />

        <ProductOptionsModal
          open={showOptionsModal}
          onOpenChange={handleCloseOptionsModal}
          produtoId={selectedProduct?.id}
          produtoNome={selectedProduct?.nome}
        />

        <ProductVariationsModal
          open={showVariationsModal}
          onOpenChange={handleCloseVariationsModal}
          produto={selectedProduct}
        />
      </div>
    </DashboardLayout>
  );
};

export default ManagerProducts;
