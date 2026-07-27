import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { confirmAction } from "@/components/ui/confirmation-host";
import { useProductOptions, CategoriaOpcao, OpcaoProduto } from "@/hooks/useProductOptions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  GripVertical,
  Layers3,
  PackagePlus,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProdutos } from "@/hooks/useProdutos";

interface ProductOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtoId?: string;
  produtoNome?: string;
}

const ProductOptionsModal = ({ open, onOpenChange, produtoId, produtoNome }: ProductOptionsModalProps) => {
  const { toast } = useToast();
  const { produtos } = useProdutos();
  const {
    categorias,
    opcoes,
    loading,
    getOpcoesParaProduto,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria,
    criarOpcao,
    atualizarOpcao,
    excluirOpcao,
    vincularCategoriaAoProduto,
    desvincularCategoriaAoProduto,
    reordenarCategorias,
    reordenarOpcoes,
    reordenarCategoriasVinculadas,
    refetch
  } = useProductOptions({ productId: produtoId });

  const [produtoOpcoes, setProdutoOpcoes] = useState<any[]>([]);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaOpcao | null>(null);
  const [editingOpcao, setEditingOpcao] = useState<OpcaoProduto | null>(null);
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  const [showOpcaoForm, setShowOpcaoForm] = useState(false);
  const [activeTab, setActiveTab] = useState("categorias");
  const [saving, setSaving] = useState(false);
  const [linkingCategory, setLinkingCategory] = useState(false);
  const [categoriaParaVincular, setCategoriaParaVincular] = useState("");
  const [draggedCategoriaId, setDraggedCategoriaId] = useState<string | null>(null);
  const [draggedOpcaoId, setDraggedOpcaoId] = useState<string | null>(null);
  const [draggedVinculoId, setDraggedVinculoId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const [categoriaForm, setCategoriaForm] = useState({
    nome: '',
    descricao: '',
    minimo: 0,
    maximo: 1,
    tipo_selecao: 'multipla' as 'unica' | 'multipla' | 'quantidade',
    maximo_por_opcao: 1,
    mostrar_preco: true,
    ordem: 0
  });

  const [opcaoForm, setOpcaoForm] = useState({
    nome: '',
    preco_adicional: 0,
    categoria_id: '',
    produto_adicional_uuid: '',
    disponivel: true,
    ordem: 0
  });

  useEffect(() => {
    if (open && produtoId) {
      void loadProdutoOpcoes();
    }
  }, [open, produtoId]);

  const loadProdutoOpcoes = async () => {
    if (!produtoId) return;
    
    try {
      const opcoes = await getOpcoesParaProduto(produtoId);
      setProdutoOpcoes(opcoes);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as opções do produto.",
        variant: "destructive",
      });
    }
  };

  const resetCategoriaForm = () => {
    setCategoriaForm({
      nome: '',
      descricao: '',
      minimo: 0,
      maximo: 1,
      tipo_selecao: 'multipla',
      maximo_por_opcao: 1,
      mostrar_preco: true,
      ordem: 0
    });
    setEditingCategoria(null);
    setShowCategoriaForm(false);
  };

  const resetOpcaoForm = () => {
    setOpcaoForm({
      nome: '',
      preco_adicional: 0,
      categoria_id: '',
      produto_adicional_uuid: '',
      disponivel: true,
      ordem: 0
    });
    setEditingOpcao(null);
    setShowOpcaoForm(false);
  };

  const handleSaveCategoria = async () => {
    if (!categoriaForm.nome.trim()) {
      toast({ title: "Informe o nome da categoria", variant: "destructive" });
      return;
    }
    if (categoriaForm.maximo < categoriaForm.minimo) {
      toast({
        title: "Limites inválidos",
        description: "O máximo não pode ser menor que o mínimo.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      if (editingCategoria) {
        await atualizarCategoria(editingCategoria.id, categoriaForm);
        toast({
          title: "Categoria atualizada",
          description: "A categoria foi atualizada com sucesso.",
        });
      } else {
        const criada = await criarCategoria(categoriaForm);
        setOpcaoForm((atual) => ({ ...atual, categoria_id: criada.id }));
        toast({
          title: "Categoria criada",
          description: "Agora cadastre os adicionais desta categoria.",
        });
        setActiveTab("opcoes");
        setShowOpcaoForm(true);
      }
      resetCategoriaForm();
      await refetch();
      await loadProdutoOpcoes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar a categoria.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOpcao = async () => {
    if (!opcaoForm.nome.trim() || !opcaoForm.categoria_id) {
      toast({
        title: "Preencha nome e categoria",
        description: "Todo adicional precisa pertencer a uma categoria.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      if (editingOpcao) {
        await atualizarOpcao(editingOpcao.id, opcaoForm);
        toast({
          title: "Opção atualizada",
          description: "A opção foi atualizada com sucesso.",
        });
      } else {
        await criarOpcao(opcaoForm);
        toast({
          title: "Opção criada",
          description: "A opção foi criada com sucesso.",
        });
      }
      resetOpcaoForm();
      await refetch();
      await loadProdutoOpcoes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar a opção.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategoria = async (id: string) => {
    if (!(await confirmAction({
      title: 'Excluir categoria de opções?',
      description: 'A categoria e seus vínculos deixarão de aparecer nos produtos.',
    }))) return;

    try {
      await excluirCategoria(id);
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao excluir a categoria.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOpcao = async (id: string) => {
    if (!(await confirmAction({
      title: 'Excluir opção?',
      description: 'Esta opção deixará de estar disponível para personalização dos produtos.',
    }))) return;

    try {
      await excluirOpcao(id);
      toast({
        title: "Opção excluída",
        description: "A opção foi excluída com sucesso.",
      });
      await Promise.all([refetch(), loadProdutoOpcoes()]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao excluir a opção.",
        variant: "destructive",
      });
    }
  };

  const handleVincularCategoria = async (categoriaId: string) => {
    if (!produtoId) {
      toast({
        title: "Produto não identificado",
        description: "Feche a janela, abra novamente o produto e tente outra vez.",
        variant: "destructive",
      });
      return;
    }

    if (!categoriaId) {
      toast({
        title: "Selecione uma categoria",
        description: "Escolha a categoria de adicionais que deseja colocar no produto.",
        variant: "destructive",
      });
      return;
    }

    setLinkingCategory(true);
    try {
      await vincularCategoriaAoProduto(produtoId, categoriaId);
      await loadProdutoOpcoes();
      setCategoriaParaVincular("");
      toast({
        title: "Adicionais incluídos no produto",
        description: "A categoria já está disponível na personalização deste produto.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao vincular a categoria.",
        variant: "destructive",
      });
    } finally {
      setLinkingCategory(false);
    }
  };

  const handleDesvincularCategoria = async (categoriaId: string) => {
    if (!produtoId) {
      toast({
        title: "Erro",
        description: "ID do produto não encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await desvincularCategoriaAoProduto(produtoId, categoriaId);
      toast({
        title: "Categoria desvinculada",
        description: "A categoria foi desvinculada do produto com sucesso.",
      });
      await loadProdutoOpcoes();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao desvincular a categoria.",
        variant: "destructive",
      });
    }
  };

  const categoriasVinculadas = produtoOpcoes.map(op => op.categoria_id);
  const categoriasVinculadasOrdenadas = Array.from(new Set(categoriasVinculadas));
  const categoriasComOpcoes = new Set(opcoes.map((opcao) => opcao.categoria_id));
  const formatPrice = (value: unknown) =>
    Number(value || 0).toFixed(2).replace(".", ",");

  const salvarOrdemCategorias = async (ids: string[]) => {
    setReordering(true);
    try {
      await reordenarCategorias(ids);
      toast({
        title: "Ordem atualizada",
        description: "A nova ordem das categorias já será usada no cardápio.",
      });
    } catch (error: any) {
      toast({
        title: "Não foi possível salvar a ordem",
        description: error.message || "Tente reorganizar novamente.",
        variant: "destructive",
      });
    } finally {
      setReordering(false);
    }
  };

  const moverCategoria = (id: string, deslocamento: -1 | 1) => {
    const ids = categorias.map(item => item.id);
    const origem = ids.indexOf(id);
    const destino = origem + deslocamento;
    if (origem < 0 || destino < 0 || destino >= ids.length || reordering) return;
    [ids[origem], ids[destino]] = [ids[destino], ids[origem]];
    void salvarOrdemCategorias(ids);
  };

  const soltarCategoria = (destinoId: string) => {
    if (!draggedCategoriaId || draggedCategoriaId === destinoId || reordering) return;
    const ids = categorias.map(item => item.id);
    const origem = ids.indexOf(draggedCategoriaId);
    const destino = ids.indexOf(destinoId);
    if (origem < 0 || destino < 0) return;
    const [movida] = ids.splice(origem, 1);
    ids.splice(destino, 0, movida);
    setDraggedCategoriaId(null);
    void salvarOrdemCategorias(ids);
  };

  const opcoesDaCategoria = (categoriaId: string) =>
    opcoes.filter(item => item.categoria_id === categoriaId);

  const salvarOrdemOpcoes = async (categoriaId: string, ids: string[]) => {
    setReordering(true);
    try {
      await reordenarOpcoes(categoriaId, ids);
      toast({
        title: "Ordem atualizada",
        description: "A nova ordem dos adicionais já será usada no cardápio.",
      });
    } catch (error: any) {
      toast({
        title: "Não foi possível salvar a ordem",
        description: error.message || "Tente reorganizar novamente.",
        variant: "destructive",
      });
    } finally {
      setReordering(false);
    }
  };

  const moverOpcao = (opcao: OpcaoProduto, deslocamento: -1 | 1) => {
    const ids = opcoesDaCategoria(opcao.categoria_id).map(item => item.id);
    const origem = ids.indexOf(opcao.id);
    const destino = origem + deslocamento;
    if (origem < 0 || destino < 0 || destino >= ids.length || reordering) return;
    [ids[origem], ids[destino]] = [ids[destino], ids[origem]];
    void salvarOrdemOpcoes(opcao.categoria_id, ids);
  };

  const soltarOpcao = (destino: OpcaoProduto) => {
    if (!draggedOpcaoId || draggedOpcaoId === destino.id || reordering) return;
    const origemOpcao = opcoes.find(item => item.id === draggedOpcaoId);
    if (!origemOpcao || origemOpcao.categoria_id !== destino.categoria_id) {
      setDraggedOpcaoId(null);
      toast({
        title: "Categorias diferentes",
        description: "Uma opção só pode ser reordenada dentro da própria categoria.",
        variant: "destructive",
      });
      return;
    }
    const ids = opcoesDaCategoria(destino.categoria_id).map(item => item.id);
    const origem = ids.indexOf(draggedOpcaoId);
    const destinoIndice = ids.indexOf(destino.id);
    if (origem < 0 || destinoIndice < 0) return;
    const [movida] = ids.splice(origem, 1);
    ids.splice(destinoIndice, 0, movida);
    setDraggedOpcaoId(null);
    void salvarOrdemOpcoes(destino.categoria_id, ids);
  };

  const salvarOrdemVinculos = async (ids: string[]) => {
    if (!produtoId) return;
    setReordering(true);
    try {
      await reordenarCategoriasVinculadas(produtoId, ids);
      const posicoes = new Map(ids.map((id, indice) => [id, indice]));
      setProdutoOpcoes(prev => [...prev].sort((a, b) =>
        (posicoes.get(a.categoria_id) ?? 9999) - (posicoes.get(b.categoria_id) ?? 9999)
        || Number(a.opcao_ordem || 0) - Number(b.opcao_ordem || 0),
      ));
      toast({
        title: "Ordem do produto atualizada",
        description: "As categorias aparecerão nesta ordem para o cliente.",
      });
    } catch (error: any) {
      toast({
        title: "Não foi possível salvar a ordem",
        description: error.message || "Tente reorganizar novamente.",
        variant: "destructive",
      });
      await loadProdutoOpcoes();
    } finally {
      setReordering(false);
    }
  };

  const moverVinculo = (id: string, deslocamento: -1 | 1) => {
    const ids = [...categoriasVinculadasOrdenadas];
    const origem = ids.indexOf(id);
    const destino = origem + deslocamento;
    if (origem < 0 || destino < 0 || destino >= ids.length || reordering) return;
    [ids[origem], ids[destino]] = [ids[destino], ids[origem]];
    void salvarOrdemVinculos(ids);
  };

  const soltarVinculo = (destinoId: string) => {
    if (!draggedVinculoId || draggedVinculoId === destinoId || reordering) return;
    const ids = [...categoriasVinculadasOrdenadas];
    const origem = ids.indexOf(draggedVinculoId);
    const destino = ids.indexOf(destinoId);
    if (origem < 0 || destino < 0) return;
    const [movido] = ids.splice(origem, 1);
    ids.splice(destino, 0, movido);
    setDraggedVinculoId(null);
    void salvarOrdemVinculos(ids);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="manager-workspace-dialog product-options-dialog max-w-5xl">
        <DialogHeader>
          <DialogTitle className="pr-2">
            Gerenciar Ingredientes/Opções {produtoNome && `- ${produtoNome}`}
          </DialogTitle>
          <DialogDescription>
            Cadastre as opções deste produto, deixe-as disponíveis e organize a ordem de exibição.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full product-options-tabs">
          <div className="options-toolbar">
            <TabsList className="modal-tabs grid w-full grid-cols-3">
              <TabsTrigger value="categorias">1. Categorias</TabsTrigger>
              <TabsTrigger value="opcoes" disabled={categorias.length === 0}>2. Adicionais</TabsTrigger>
              <TabsTrigger value="produto">3. No produto</TabsTrigger>
            </TabsList>
            {(activeTab === "categorias" || activeTab === "opcoes") && (
              <Button onClick={() => {
                if (activeTab === "categorias") {
                  setShowCategoriaForm(true);
                  return;
                }
                setShowOpcaoForm(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                {activeTab === "categorias" ? "Nova categoria" : "Nova opção"}
              </Button>
            )}
          </div>

          <TabsContent value="produto" className="space-y-4">
            <div className="space-y-4">
              <Card className="options-link-card">
                <CardHeader>
                  <CardTitle className="text-base">Adicionar opções a este produto</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Selecione uma categoria. Todas as opções cadastradas nela serão mostradas ao cliente.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Select value={categoriaParaVincular} onValueChange={setCategoriaParaVincular}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma categoria de adicionais" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias
                        .filter(cat =>
                          !categoriasVinculadas.includes(cat.id)
                          && categoriasComOpcoes.has(cat.id),
                        )
                        .map(categoria => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!categoriaParaVincular || linkingCategory}
                    onClick={() => void handleVincularCategoria(categoriaParaVincular)}
                  >
                    <Plus className={linkingCategory ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                    {linkingCategory ? "Adicionando..." : "Adicionar ao produto"}
                  </Button>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Categorias vinculadas ao produto</h3>
              </div>

              {produtoOpcoes.length === 0 ? (
                <div className="options-empty">
                  <Settings2 />
                  <strong>Produto sem personalizações</strong>
                  <p>Vincule uma categoria abaixo para disponibilizar seus adicionais neste produto.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categoriasVinculadasOrdenadas.map((categoriaId, indice) => {
                    const categoria = produtoOpcoes.find(op => op.categoria_id === categoriaId);
                    const opcoesCategoria = produtoOpcoes.filter(op => op.categoria_id === categoriaId);
                    
                    return (
                      <Card
                        key={categoriaId}
                        className={draggedVinculoId === categoriaId ? "opacity-50 ring-2 ring-primary" : ""}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => soltarVinculo(categoriaId)}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex min-w-0 items-start gap-3">
                              <button
                                type="button"
                                draggable={!reordering}
                                onDragStart={() => setDraggedVinculoId(categoriaId)}
                                onDragEnd={() => setDraggedVinculoId(null)}
                                className="flex h-10 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl border bg-background text-muted-foreground active:cursor-grabbing"
                                aria-label={`Arrastar categoria ${categoria?.categoria_nome || ""}`}
                                title="Arraste para reorganizar neste produto"
                              >
                                <GripVertical className="h-5 w-5" />
                              </button>
                              <div className="min-w-0">
                              <CardTitle className="text-base">{categoria?.categoria_nome}</CardTitle>
                              {categoria?.categoria_descricao && (
                                <p className="text-sm text-gray-600">{categoria.categoria_descricao}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Min: {categoria?.categoria_minimo}, Max: {categoria?.categoria_maximo}
                              </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={indice === 0 || reordering}
                                onClick={() => moverVinculo(categoriaId, -1)}
                                aria-label="Mover categoria vinculada para cima"
                                title="Mover para cima"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={indice === categoriasVinculadasOrdenadas.length - 1 || reordering}
                                onClick={() => moverVinculo(categoriaId, 1)}
                                aria-label="Mover categoria vinculada para baixo"
                                title="Mover para baixo"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDesvincularCategoria(categoriaId)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Desvincular
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {opcoesCategoria.some(opcao => opcao.opcao_id) ? (
                              opcoesCategoria.map(opcao => (
                                opcao.opcao_id && (
                                  <div key={opcao.opcao_id} className="flex justify-between items-center p-2 border rounded">
                                  <div className="flex items-center gap-2">
                                    <span>{opcao.opcao_nome}</span>
                                    {opcao.opcao_preco_adicional > 0 && (
                                      <Badge variant="secondary">
                                        +R$ {formatPrice(opcao.opcao_preco_adicional)}
                                      </Badge>
                                    )}
                                    <Badge variant={opcao.opcao_disponivel ? "default" : "secondary"}>
                                      {opcao.opcao_disponivel ? "Disponível" : "Indisponível"}
                                    </Badge>
                                  </div>
                                  </div>
                                )
                              ))
                            ) : (
                              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                                Categoria vinculada, mas ainda sem adicionais. Cadastre um adicional
                                na etapa “Adicionais”.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

            </div>
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4">
            {showCategoriaForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingCategoria ? 'Editar' : 'Nova'} Categoria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome da Categoria *</Label>
                    <Input
                      id="nome"
                      value={categoriaForm.nome}
                      onChange={(e) => setCategoriaForm(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Acompanhamentos, Carnes, Extras"
                    />
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={categoriaForm.descricao}
                      onChange={(e) => setCategoriaForm(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descrição da categoria"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minimo">Mínimo *</Label>
                      <Input
                        id="minimo"
                        type="number"
                        min="0"
                        value={categoriaForm.minimo}
                        onChange={(e) => setCategoriaForm(prev => ({ ...prev, minimo: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maximo">Máximo *</Label>
                      <Input
                        id="maximo"
                        type="number"
                        min="1"
                        value={categoriaForm.maximo}
                        onChange={(e) => setCategoriaForm(prev => ({ ...prev, maximo: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="categoria-ordem">Ordem de exibição</Label>
                    <Input
                      id="categoria-ordem"
                      type="number"
                      min="0"
                      value={categoriaForm.ordem}
                      onChange={(e) => setCategoriaForm(prev => ({
                        ...prev,
                        ordem: Math.max(0, parseInt(e.target.value) || 0),
                      }))}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Números menores aparecem primeiro no produto.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="grid w-full gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Tipo de seleção</Label>
                        <Select value={categoriaForm.tipo_selecao} onValueChange={(value: 'unica' | 'multipla' | 'quantidade') => setCategoriaForm(prev => ({
                          ...prev, tipo_selecao: value,
                          maximo: value === 'unica' ? 1 : prev.maximo,
                          maximo_por_opcao: value === 'unica' ? 1 : prev.maximo_por_opcao
                        }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unica">Uma opção (Talher: Sim/Não)</SelectItem>
                            <SelectItem value="multipla">Várias opções</SelectItem>
                            <SelectItem value="quantidade">Quantidade de porções</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="maximo_por_opcao">Máximo por opção</Label>
                        <Input id="maximo_por_opcao" type="number" min="1"
                          disabled={categoriaForm.tipo_selecao === 'unica'}
                          value={categoriaForm.maximo_por_opcao}
                          onChange={(e) => setCategoriaForm(prev => ({ ...prev, maximo_por_opcao: Math.max(1, parseInt(e.target.value) || 1) }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mostrar_preco"
                      checked={categoriaForm.mostrar_preco}
                      onCheckedChange={(checked) => setCategoriaForm(prev => ({ ...prev, mostrar_preco: checked }))}
                    />
                    <Label htmlFor="mostrar_preco">Mostrar preços das opções</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveCategoria} disabled={saving}>
                      {saving ? "Salvando..." : "Salvar e continuar"}
                    </Button>
                    <Button variant="outline" onClick={resetCategoriaForm}>Cancelar</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {!loading && categorias.length === 0 && (
                <div className="options-empty">
                  <Layers3 />
                  <strong>Comece criando uma categoria</strong>
                  <p>Exemplos: Escolha o tamanho, Adicionais, Talheres ou Escolha o molho.</p>
                </div>
              )}
              {categorias.map((categoria, indice) => (
                <Card
                  key={categoria.id}
                  className={draggedCategoriaId === categoria.id ? "opacity-50 ring-2 ring-primary" : ""}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => soltarCategoria(categoria.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex min-w-0 items-start gap-3">
                        <button
                          type="button"
                          draggable={!reordering}
                          onDragStart={() => setDraggedCategoriaId(categoria.id)}
                          onDragEnd={() => setDraggedCategoriaId(null)}
                          className="mt-0.5 flex h-10 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl border bg-background text-muted-foreground active:cursor-grabbing"
                          aria-label={`Arrastar categoria ${categoria.nome}`}
                          title="Arraste para reorganizar"
                        >
                          <GripVertical className="h-5 w-5" />
                        </button>
                        <div className="min-w-0">
                        <h4 className="font-medium">{categoria.nome}</h4>
                        {categoria.descricao && (
                          <p className="text-sm text-gray-600">{categoria.descricao}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Min: {categoria.minimo}, Max: {categoria.maximo}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={categoria.mostrar_preco ? "default" : "secondary"}>
                            {categoria.mostrar_preco ? "Preços visíveis" : "Preços ocultos"}
                          </Badge>
                        </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={indice === 0 || reordering}
                          onClick={() => moverCategoria(categoria.id, -1)}
                          aria-label={`Mover ${categoria.nome} para cima`}
                          title="Mover para cima"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={indice === categorias.length - 1 || reordering}
                          onClick={() => moverCategoria(categoria.id, 1)}
                          aria-label={`Mover ${categoria.nome} para baixo`}
                          title="Mover para baixo"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCategoria(categoria);
                            setCategoriaForm({
                              nome: categoria.nome,
                              descricao: categoria.descricao || '',
                              minimo: categoria.minimo,
                              maximo: categoria.maximo,
                              tipo_selecao: categoria.tipo_selecao || 'multipla',
                              maximo_por_opcao: categoria.maximo_por_opcao || 1,
                              mostrar_preco: categoria.mostrar_preco,
                              ordem: categoria.ordem || 0
                            });
                            setShowCategoriaForm(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCategoria(categoria.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="opcoes" className="space-y-4">
            {showOpcaoForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingOpcao ? 'Editar' : 'Nova'} Opção</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="opcao-nome">Nome da Opção *</Label>
                    <Input
                      id="opcao-nome"
                      value={opcaoForm.nome}
                      onChange={(e) => setOpcaoForm(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Arroz, Feijão, Batata Frita"
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select 
                      value={opcaoForm.categoria_id} 
                      onValueChange={(value) => setOpcaoForm(prev => ({ ...prev, categoria_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(categoria => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preco">Preço Adicional (R$)</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      min="0"
                      value={opcaoForm.preco_adicional}
                      onChange={(e) => setOpcaoForm(prev => ({ ...prev, preco_adicional: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="opcao-ordem">Ordem de exibição</Label>
                    <Input
                      id="opcao-ordem"
                      type="number"
                      min="0"
                      value={opcaoForm.ordem}
                      onChange={(e) => setOpcaoForm(prev => ({
                        ...prev,
                        ordem: Math.max(0, parseInt(e.target.value) || 0),
                      }))}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Define a posição desta opção dentro da categoria.
                    </p>
                  </div>

                  <div>
                    <Label>Usar produto do catálogo como adicional</Label>
                    <Select value={opcaoForm.produto_adicional_uuid || "manual"} onValueChange={(value) =>
                      setOpcaoForm(prev => ({ ...prev, produto_adicional_uuid: value === "manual" ? "" : value }))
                    }>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Nenhum — usar preço manual</SelectItem>
                        {produtos.filter(item => item.id !== produtoId).map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.nome} · R$ {Number(item.preco).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-gray-500">O preço atual do produto será usado pelo servidor.</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="disponivel"
                      checked={opcaoForm.disponivel}
                      onCheckedChange={(checked) => setOpcaoForm(prev => ({ ...prev, disponivel: checked }))}
                    />
                    <Label htmlFor="disponivel">Disponível</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveOpcao} disabled={saving}>
                      {saving ? "Salvando..." : "Salvar adicional"}
                    </Button>
                    <Button variant="outline" onClick={resetOpcaoForm}>Cancelar</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {!loading && opcoes.length === 0 && (
                <div className="options-empty">
                  <PackagePlus />
                  <strong>Nenhum adicional cadastrado</strong>
                  <p>Crie opções como Bacon, Catupiry, Sem talher ou Porção extra.</p>
                </div>
              )}
              {opcoes.map((opcao) => {
                const categoria = categorias.find(c => c.id === opcao.categoria_id);
                const opcoesIrmãs = opcoesDaCategoria(opcao.categoria_id);
                const indice = opcoesIrmãs.findIndex(item => item.id === opcao.id);
                return (
                  <Card
                    key={opcao.id}
                    className={draggedOpcaoId === opcao.id ? "opacity-50 ring-2 ring-primary" : ""}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => soltarOpcao(opcao)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex min-w-0 items-start gap-3">
                          <button
                            type="button"
                            draggable={!reordering}
                            onDragStart={() => setDraggedOpcaoId(opcao.id)}
                            onDragEnd={() => setDraggedOpcaoId(null)}
                            className="mt-0.5 flex h-10 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl border bg-background text-muted-foreground active:cursor-grabbing"
                            aria-label={`Arrastar opção ${opcao.nome}`}
                            title="Arraste para reorganizar"
                          >
                            <GripVertical className="h-5 w-5" />
                          </button>
                          <div className="min-w-0">
                          <h4 className="font-medium">{opcao.nome}</h4>
                          <p className="text-sm text-gray-600">
                            Categoria: {categoria?.nome || 'N/A'}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {opcao.preco_adicional > 0 && (
                              <Badge variant="secondary">
                                +R$ {formatPrice(opcao.preco_adicional)}
                              </Badge>
                            )}
                            <Badge variant={opcao.disponivel ? "default" : "secondary"}>
                              {opcao.disponivel ? "Disponível" : "Indisponível"}
                            </Badge>
                          </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={indice <= 0 || reordering}
                            onClick={() => moverOpcao(opcao, -1)}
                            aria-label={`Mover ${opcao.nome} para cima`}
                            title="Mover para cima"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={indice === opcoesIrmãs.length - 1 || reordering}
                            onClick={() => moverOpcao(opcao, 1)}
                            aria-label={`Mover ${opcao.nome} para baixo`}
                            title="Mover para baixo"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingOpcao(opcao);
                              setOpcaoForm({
                                nome: opcao.nome,
                              preco_adicional: Number(opcao.preco_adicional || 0),
                              categoria_id: opcao.categoria_id,
                              produto_adicional_uuid: opcao.produto_adicional_uuid || '',
                              disponivel: opcao.disponivel,
                              ordem: opcao.ordem || 0
                              });
                              setShowOpcaoForm(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteOpcao(opcao.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProductOptionsModal;
