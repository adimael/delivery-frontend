import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { produtosAPI } from "@/lib/api";
import { useCategoriasProduto } from "@/hooks/useCategoriasProduto";
import { ChevronDown, ChevronUp, ImagePlus, Trash2 } from "lucide-react";

interface Produto {
  id?: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria_id?: string;
  url_imagem?: string;
  imagens?: Array<{ id?: string; url: string } | string>;
  disponivel: boolean;
  tempo_preparo?: number;
}

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: Produto;
  onSuccess: () => void;
}

const ProductFormModal = ({ open, onOpenChange, produto, onSuccess }: ProductFormModalProps) => {
  const { toast } = useToast();
  const { categorias } = useCategoriasProduto();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Produto>({
    nome: '',
    descricao: '',
    preco: 0,
    categoria_id: '',
    url_imagem: '',
    disponivel: true,
    tempo_preparo: 0
  });
  const [imagens, setImagens] = useState<string[]>(['']);

  useEffect(() => {
    if (open) {
      if (produto) {
        const galeria = (produto.imagens || [])
          .map((imagem) => typeof imagem === 'string' ? imagem : imagem.url)
          .filter(Boolean);
        setFormData({
          nome: produto.nome || '',
          descricao: produto.descricao || '',
          preco: produto.preco || 0,
          categoria_id: produto.categoria_id || '',
          url_imagem: produto.url_imagem || '',
          disponivel: produto.disponivel ?? true,
          tempo_preparo: produto.tempo_preparo || 0
        });
        setImagens(galeria.length > 0 ? galeria : [produto.url_imagem || '']);
      } else {
        setFormData({
          nome: '',
          descricao: '',
          preco: 0,
          categoria_id: '',
          url_imagem: '',
          disponivel: true,
          tempo_preparo: 0
        });
        setImagens(['']);
      }
    }
  }, [open, produto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        nome: formData.nome,
        descricao: formData.descricao,
        preco: formData.preco,
        categoria_id: formData.categoria_id || null,
        url_imagem: imagens.find(url => url.trim() !== '') || '',
        imagens: imagens.map(url => url.trim()).filter(Boolean),
        disponivel: formData.disponivel,
        tempo_preparo: formData.tempo_preparo
      };

      if (produto?.id) {
        await produtosAPI.update(produto.id, dataToSave);

        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso.",
        });
      } else {
        await produtosAPI.create(dataToSave);

        toast({
          title: "Produto criado",
          description: "O produto foi criado com sucesso.",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o produto.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {produto ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Produto</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="preco">Preço (R$)</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              min="0"
              value={formData.preco}
              onChange={(e) => setFormData(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="categoria_id">Categoria</Label>
            <Select value={formData.categoria_id || undefined} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value || '' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tempo_preparo">Tempo de Preparo (minutos)</Label>
            <Input
              id="tempo_preparo"
              type="number"
              min="0"
              value={formData.tempo_preparo}
              onChange={(e) => setFormData(prev => ({ ...prev, tempo_preparo: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Fotos do produto</Label>
                <p className="text-xs text-muted-foreground">
                  A primeira foto será usada como capa. Limite de 10 imagens.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={imagens.length >= 10}
                onClick={() => setImagens(prev => [...prev, ''])}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                Adicionar foto
              </Button>
            </div>

            {imagens.map((url, indice) => (
              <div key={indice} className="rounded-2xl border bg-muted/20 p-3">
                <div className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-muted">
                    {url ? (
                      <img
                        src={url}
                        alt={`Prévia da foto ${indice + 1}`}
                        className="h-full w-full object-cover"
                        onLoad={(event) => { event.currentTarget.style.display = 'block'; }}
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-muted-foreground">
                        <ImagePlus className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">Foto {indice + 1}</strong>
                      {indice === 0 && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Capa
                        </span>
                      )}
                    </div>
                    <Input
                      value={url}
                      type="url"
                      onChange={(event) => setImagens(prev =>
                        prev.map((item, atual) => atual === indice ? event.target.value : item),
                      )}
                      placeholder="https://exemplo.com/foto.jpg"
                    />
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={indice === 0}
                      onClick={() => setImagens(prev => {
                        const nova = [...prev];
                        [nova[indice - 1], nova[indice]] = [nova[indice], nova[indice - 1]];
                        return nova;
                      })}
                      aria-label="Mover foto para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={indice === imagens.length - 1}
                      onClick={() => setImagens(prev => {
                        const nova = [...prev];
                        [nova[indice], nova[indice + 1]] = [nova[indice + 1], nova[indice]];
                        return nova;
                      })}
                      aria-label="Mover foto para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setImagens(prev =>
                        prev.length === 1 ? [''] : prev.filter((_, atual) => atual !== indice),
                      )}
                      aria-label="Remover foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="disponivel"
              checked={formData.disponivel}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, disponivel: checked }))}
            />
            <Label htmlFor="disponivel">Produto disponível</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (produto ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;
