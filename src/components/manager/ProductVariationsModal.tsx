
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { confirmAction } from "@/components/ui/confirmation-host";
import { useProductVariations, ProductVariation } from "@/hooks/useProductVariations";

interface ProductVariationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: { id: string; nome: string } | null;
}

const ProductVariationsModal = ({ open, onOpenChange, produto }: ProductVariationsModalProps) => {
  const { toast } = useToast();
  const {
    variations,
    getVariationsByProduct,
    createVariation,
    updateVariation,
    deleteVariation,
    createBulkVariations,
    refetch
  } = useProductVariations();

  const [newVariationType, setNewVariationType] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [editingVariation, setEditingVariation] = useState<ProductVariation | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const [editForm, setEditForm] = useState({
    nome: '',
    preco_adicional: 0,
    estoque: 0,
    disponivel: true
  });

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open]);

  const productVariations = produto?.id ? getVariationsByProduct(produto.id) : [];
  const variationTypes = [...new Set(productVariations.map(v => v.tipo_variacao))];

  const handleCreateBulkVariations = async () => {
    if (!produto?.id || !newVariationType || !bulkInput) return;

    const names = bulkInput.split(',').map(name => name.trim()).filter(name => name);
    
    if (names.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma variação.",
        variant: "destructive",
      });
      return;
    }

    const result = await createBulkVariations(produto.id, newVariationType, names);
    
    if (result.success) {
      toast({
        title: "Variações criadas",
        description: `${names.length} variações foram criadas com sucesso.`,
      });
      setNewVariationType('');
      setBulkInput('');
    } else {
      toast({
        title: "Erro",
        description: result.error || "Ocorreu um erro ao criar as variações.",
        variant: "destructive",
      });
    }
  };

  const handleEditVariation = (variation: ProductVariation) => {
    setEditingVariation(variation);
    setEditForm({
      nome: variation.nome,
      preco_adicional: variation.preco_adicional,
      estoque: variation.estoque,
      disponivel: variation.disponivel
    });
    setShowEditForm(true);
  };

  const handleUpdateVariation = async () => {
    if (!editingVariation) return;

    const result = await updateVariation(editingVariation.id, editForm);
    
    if (result.success) {
      toast({
        title: "Variação atualizada",
        description: "A variação foi atualizada com sucesso.",
      });
      setShowEditForm(false);
      setEditingVariation(null);
    } else {
      toast({
        title: "Erro",
        description: result.error || "Ocorreu um erro ao atualizar a variação.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVariation = async (id: string) => {
    if (!(await confirmAction({
      title: 'Excluir variação?',
      description: 'Esta variação será removida do produto e não poderá ser recuperada.',
    }))) return;

    const result = await deleteVariation(id);
    
    if (result.success) {
      toast({
        title: "Variação excluída",
        description: "A variação foi excluída com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Ocorreu um erro ao excluir a variação.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="manager-workspace-dialog max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Gerenciar Variações {produto?.nome && `- ${produto.nome}`}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="add" className="w-full product-variations-tabs">
          <TabsList className="modal-tabs grid w-full grid-cols-2">
            <TabsTrigger value="add">Adicionar Variações</TabsTrigger>
            <TabsTrigger value="current">Variações Atuais</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {variationTypes.length === 0 ? (
              <p className="text-gray-500">Nenhuma variação encontrada para este produto.</p>
            ) : (
              <div className="space-y-6">
                {variationTypes.map(type => (
                  <Card key={type}>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">{type}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {productVariations
                          .filter(v => v.tipo_variacao === type)
                          .map(variation => (
                            <div key={variation.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{variation.nome}</span>
                                {variation.preco_adicional > 0 && (
                                  <Badge variant="secondary">
                                    +R$ {variation.preco_adicional.toFixed(2)}
                                  </Badge>
                                )}
                                <Badge variant="outline">
                                  Estoque: {variation.estoque}
                                </Badge>
                                <Badge variant={variation.disponivel ? "default" : "secondary"}>
                                  {variation.disponivel ? "Disponível" : "Indisponível"}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditVariation(variation)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteVariation(variation.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Variações em Lote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Variação</Label>
                  <Select value={newVariationType} onValueChange={setNewVariationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tamanho">Tamanho</SelectItem>
                      <SelectItem value="numeracao">Numeração</SelectItem>
                      <SelectItem value="cor">Cor</SelectItem>
                      <SelectItem value="sabor">Sabor</SelectItem>
                      <SelectItem value="modelo">Modelo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="variations">Variações (separadas por vírgula)</Label>
                  <Input
                    id="variations"
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="Ex: P, M, G, GG ou 38, 39, 40, 41, 42"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Digite as variações separadas por vírgula
                  </p>
                </div>

                <Button onClick={handleCreateBulkVariations} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Variações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form de Edição */}
        {showEditForm && (
          <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Editar Variação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={editForm.nome}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="preco_adicional">Preço Adicional (R$)</Label>
                  <Input
                    id="preco_adicional"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.preco_adicional}
                    onChange={(e) => setEditForm(prev => ({ ...prev, preco_adicional: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="estoque">Estoque</Label>
                  <Input
                    id="estoque"
                    type="number"
                    min="0"
                    value={editForm.estoque}
                    onChange={(e) => setEditForm(prev => ({ ...prev, estoque: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="disponivel"
                    checked={editForm.disponivel}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, disponivel: checked }))}
                  />
                  <Label htmlFor="disponivel">Disponível</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpdateVariation}>Salvar</Button>
                  <Button variant="outline" onClick={() => setShowEditForm(false)}>Cancelar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductVariationsModal;
