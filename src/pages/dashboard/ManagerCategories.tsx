import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Edit, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { useCategoriasProduto } from "@/hooks/useCategoriasProduto";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ManagerCategories = () => {
  const {
    categorias,
    loading,
    criarCategoria,
    atualizarCategoria,
    deletarCategoria,
    reordenarCategorias,
  } = useCategoriasProduto(false);
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const categoryData = {
      nome: formData.nome,
      descricao: formData.descricao,
      ativo: true // Use ativo instead of disponivel
    };

    let result;
    if (editingCategory) {
      result = await atualizarCategoria(editingCategory, categoryData);
    } else {
      result = await criarCategoria(categoryData);
    }

    if (result.success) {
      toast({
        title: editingCategory ? "Categoria atualizada" : "Categoria criada",
        description: editingCategory ? "A categoria foi atualizada com sucesso" : "A nova categoria foi criada com sucesso",
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ nome: '', descricao: '' });
    } else {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a categoria",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (categoria: any) => {
    setEditingCategory(categoria.id);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deletarCategoria(id);
    
    if (result.success) {
      toast({
        title: "Categoria removida",
        description: "A categoria foi removida com sucesso",
      });
    } else {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover a categoria",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({ nome: '', descricao: '' });
    setIsDialogOpen(true);
  };

  const salvarNovaOrdem = async (ids: string[]) => {
    if (savingOrder || ids.length !== categorias.length) return;
    setSavingOrder(true);
    const result = await reordenarCategorias(ids);
    setSavingOrder(false);
    toast({
      title: result.success ? "Ordem atualizada" : "Não foi possível alterar a ordem",
      description: result.success
        ? "A nova ordem já será usada no cardápio e na opção Tudo."
        : "A ordem anterior foi restaurada. Tente novamente.",
      variant: result.success ? "default" : "destructive",
    });
  };

  const moverCategoria = (indice: number, deslocamento: -1 | 1) => {
    const destino = indice + deslocamento;
    if (destino < 0 || destino >= categorias.length) return;
    const ids = categorias.map(item => item.id);
    [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
    void salvarNovaOrdem(ids);
  };

  const soltarCategoria = (destinoId: string) => {
    if (!draggedCategory || draggedCategory === destinoId) {
      setDraggedCategory(null);
      return;
    }
    const ids = categorias.map(item => item.id);
    const origem = ids.indexOf(draggedCategory);
    const destino = ids.indexOf(destinoId);
    if (origem < 0 || destino < 0) return;
    ids.splice(destino, 0, ids.splice(origem, 1)[0]);
    setDraggedCategory(null);
    void salvarNovaOrdem(ids);
  };

  if (loading) {
    return (
      <DashboardLayout title="Categorias" userType="manager">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kumekume-orange"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Categorias" userType="manager">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Categorias de Produtos</h1>
            <p className="text-gray-600">Gerencie e ordene as seções exibidas no cardápio</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        {categorias.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Arraste os cards ou use as setas para definir a ordem no cardápio.
            </p>
            {savingOrder && (
              <span className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando
              </span>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categorias.map((categoria, indice) => (
            <Card
              key={categoria.id}
              draggable={!savingOrder}
              onDragStart={() => setDraggedCategory(categoria.id)}
              onDragEnd={() => setDraggedCategory(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => soltarCategoria(categoria.id)}
              className={draggedCategory === categoria.id ? "opacity-50" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex min-w-0 items-center gap-2">
                    <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">
                      {String(indice + 1).padStart(2, "0")}
                    </span>
                    <CardTitle className="truncate text-lg">{categoria.nome}</CardTitle>
                  </div>
                  <Badge variant={categoria.ativo ? "default" : "secondary"}>
                    {categoria.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {categoria.descricao || "Sem descrição"}
                  </p>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={savingOrder || indice === 0}
                      onClick={() => moverCategoria(indice, -1)}
                      aria-label={`Mover ${categoria.nome} para cima`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={savingOrder || indice === categorias.length - 1}
                      onClick={() => moverCategoria(indice, 1)}
                      aria-label={`Mover ${categoria.nome} para baixo`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(categoria)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(categoria.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {categorias.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">Nenhuma categoria encontrada</p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira categoria
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? "Atualize as informações da categoria" 
                    : "Crie uma nova categoria para organizar seus produtos"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="nome">Nome da Categoria</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Pratos Principais"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descrição da categoria (opcional)"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategory ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManagerCategories;
