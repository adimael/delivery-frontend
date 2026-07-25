import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProductOptions, type ProdutoOpcaoCompleta } from "@/hooks/useProductOptions";
import { useProductVariations } from "@/hooks/useProductVariations";

interface Props {
  product: { id: string; name: string; price: number; image: string };
  open: boolean;
  onClose: () => void;
  onAddToCart: (product: unknown) => void;
}

type SelectionType = "unica" | "multipla" | "quantidade";
type Quantities = Record<string, Record<string, number>>;

interface LocalCategory {
  id: string;
  nome: string;
  descricao: string;
  minimo: number;
  maximo: number;
  tipo: SelectionType;
  maximoPorOpcao: number;
  mostrarPreco: boolean;
  opcoes: Array<{
    id: string;
    nome: string;
    preco: number;
    disponivel: boolean;
    produtoAdicionalId?: string | null;
    produtoAdicionalNome?: string | null;
  }>;
}

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const ProductOptionModal = ({ product, open, onClose, onAddToCart }: Props) => {
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [optionQuantities, setOptionQuantities] = useState<Quantities>({});
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [rawOptions, setRawOptions] = useState<ProdutoOpcaoCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { getOpcoesParaProduto } = useProductOptions();
  const { getVariationsByProduct, refetch: refetchVariations } = useProductVariations();
  const productVariations = getVariationsByProduct(product.id);
  const variationTypes = [...new Set(productVariations.map((item) => item.tipo_variacao))];
  const basePrice = Number(product.price) || 0;

  useEffect(() => {
    if (!open || !product.id) return;
    setLoading(true);
    Promise.all([getOpcoesParaProduto(product.id), refetchVariations()])
      .then(([options]) => setRawOptions(options))
      .catch(() => {
        toast({ title: "Não foi possível carregar as opções", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [open, product.id]);

  const categories = useMemo(() => {
    const map = new Map<string, LocalCategory>();
    rawOptions.forEach((item) => {
      if (!map.has(item.categoria_id)) {
        map.set(item.categoria_id, {
          id: item.categoria_id,
          nome: item.categoria_nome,
          descricao: item.categoria_descricao || "",
          minimo: Number(item.categoria_minimo || 0),
          maximo: Number(item.categoria_maximo || 1),
          tipo: item.categoria_tipo_selecao || (item.categoria_maximo === 1 ? "unica" : "multipla"),
          maximoPorOpcao: Number(item.categoria_maximo_por_opcao || 1),
          mostrarPreco: item.categoria_mostrar_preco !== false,
          opcoes: [],
        });
      }
      if (item.opcao_id) {
        map.get(item.categoria_id)!.opcoes.push({
          id: item.opcao_id,
          nome: item.opcao_nome || "Opção",
          preco: Number(item.opcao_preco_adicional || 0),
          disponivel: item.opcao_disponivel !== false,
          produtoAdicionalId: item.opcao_produto_adicional_id,
          produtoAdicionalNome: item.opcao_produto_adicional_nome,
        });
      }
    });
    return [...map.values()];
  }, [rawOptions]);

  const selectedCount = (category: LocalCategory) =>
    category.tipo === "quantidade"
      ? Object.values(optionQuantities[category.id] || {}).reduce((sum, amount) => sum + amount, 0)
      : (selected[category.id] || []).length;

  const toggle = (category: LocalCategory, optionId: string) => {
    setSelected((current) => {
      const values = current[category.id] || [];
      if (category.tipo === "unica") return { ...current, [category.id]: [optionId] };
      if (values.includes(optionId)) {
        return { ...current, [category.id]: values.filter((id) => id !== optionId) };
      }
      if (values.length >= category.maximo) {
        toast({ title: `Limite de ${category.maximo} opções atingido` });
        return current;
      }
      return { ...current, [category.id]: [...values, optionId] };
    });
  };

  const changeOptionQuantity = (category: LocalCategory, optionId: string, delta: number) => {
    setOptionQuantities((current) => {
      const group = current[category.id] || {};
      const present = group[optionId] || 0;
      const groupTotal = Object.values(group).reduce((sum, amount) => sum + amount, 0);
      const next = Math.max(0, Math.min(category.maximoPorOpcao, present + delta));
      if (delta > 0 && groupTotal >= category.maximo) {
        toast({ title: `Limite de ${category.maximo} porções atingido` });
        return current;
      }
      return { ...current, [category.id]: { ...group, [optionId]: next } };
    });
  };

  const additions = categories.reduce((sum, category) => sum + category.opcoes.reduce((subtotal, option) => {
    const amount = category.tipo === "quantidade"
      ? optionQuantities[category.id]?.[option.id] || 0
      : (selected[category.id] || []).includes(option.id) ? 1 : 0;
    return subtotal + option.preco * amount;
  }, 0), 0);
  const variationAdditions = Object.values(selectedVariations).reduce((sum, id) => {
    const variation = productVariations.find((item) => item.id === id);
    return sum + Number(variation?.preco_adicional || 0);
  }, 0);
  const total = (basePrice + additions + variationAdditions) * quantity;

  const reset = () => {
    setSelected({});
    setOptionQuantities({});
    setSelectedVariations({});
    setNotes("");
    setQuantity(1);
  };

  const close = () => {
    reset();
    onClose();
  };

  const addToCart = () => {
    for (const category of categories) {
      const count = selectedCount(category);
      if (count < category.minimo || count > category.maximo) {
        toast({
          title: "Complete as opções obrigatórias",
          description: `${category.nome}: escolha entre ${category.minimo} e ${category.maximo}.`,
          variant: "destructive",
        });
        return;
      }
    }
    for (const type of variationTypes) {
      if (!selectedVariations[type]) {
        toast({ title: `Selecione uma opção de ${type}`, variant: "destructive" });
        return;
      }
    }

    const selections = categories.flatMap((category) => category.opcoes.flatMap((option) => {
      const amount = category.tipo === "quantidade"
        ? optionQuantities[category.id]?.[option.id] || 0
        : (selected[category.id] || []).includes(option.id) ? 1 : 0;
      return amount > 0 ? [{
        id: option.id,
        opcao_uuid: option.id,
        nome: option.nome,
        quantidade: amount,
        preco_adicional: option.preco,
        categoria: category.nome,
        produto_adicional_uuid: option.produtoAdicionalId,
      }] : [];
    }));

    const variations = Object.fromEntries(
      Object.entries(selectedVariations).map(([type, id]) => [
        type,
        productVariations.find((variation) => variation.id === id),
      ]),
    );
    onAddToCart({
      ...product,
      price: basePrice,
      quantity,
      totalPrice: total,
      customizations: { selections, variations, notes },
    });
    close();
  };

  if (loading) {
    return <Dialog open={open} onOpenChange={close}><DialogContent><p className="py-10 text-center">Carregando opções...</p></DialogContent></Dialog>;
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="delivery-options-dialog bottom-0 top-auto max-h-[94dvh] max-w-none translate-y-0 overflow-y-auto rounded-t-3xl p-4 sm:bottom-auto sm:top-[50%] sm:max-w-2xl sm:translate-y-[-50%] sm:rounded-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="pr-8 text-left text-2xl font-black">
            {product.name}
            <span
              className="delivery-theme-accent mt-2 block text-2xl"
              aria-live="polite"
              aria-atomic="true"
            >
              Total: {money(total)}
            </span>
            <small className="mt-1 block text-sm font-medium text-muted-foreground">
              Base {money(basePrice * quantity)}
              {additions + variationAdditions > 0
                ? ` + ${money((additions + variationAdditions) * quantity)} em adicionais`
                : ""}
            </small>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-7 py-4">
          {variationTypes.map((type) => (
            <section key={type}>
              <h3 className="text-xl font-black capitalize">{type} <small className="text-sm font-medium text-gray-500">Obrigatório</small></h3>
              <div className="mt-3 grid gap-3">
                {productVariations.filter((item) => item.tipo_variacao === type && item.disponivel).map((variation) => (
                  <label key={variation.id} className={`delivery-option-row ${selectedVariations[type] === variation.id ? "is-selected" : ""}`}>
                    <span className="font-bold">{variation.nome}</span>
                    <span className="flex items-center gap-3">{variation.preco_adicional > 0 && `+${money(variation.preco_adicional)}`}<input className="h-6 w-6" type="radio" name={type} checked={selectedVariations[type] === variation.id} onChange={() => setSelectedVariations((value) => ({ ...value, [type]: variation.id }))} /></span>
                  </label>
                ))}
              </div>
            </section>
          ))}

          {categories.map((category) => (
            <section key={category.id}>
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="text-xl font-black">{category.nome}</h3><p className="text-sm text-gray-500">{category.descricao || `Escolha entre ${category.minimo} e ${category.maximo}`}</p></div>
                {category.minimo > 0 && <span className="delivery-required-badge rounded-full px-3 py-1 text-xs font-bold">Obrigatório</span>}
              </div>
              <p className="delivery-theme-accent mt-2 text-sm font-bold">{selectedCount(category)}/{category.maximo} selecionados</p>
              <div className="mt-3 grid gap-3">
                {category.opcoes.map((option) => {
                  const isSelected = (selected[category.id] || []).includes(option.id);
                  const amount = optionQuantities[category.id]?.[option.id] || 0;
                  return (
                    <div
                      key={option.id}
                      className={`delivery-option-row ${isSelected || amount > 0 ? "is-selected" : ""} ${!option.disponivel ? "opacity-45" : ""} ${category.tipo !== "quantidade" && option.disponivel ? "cursor-pointer" : ""}`}
                      role={category.tipo !== "quantidade" ? "button" : undefined}
                      tabIndex={category.tipo !== "quantidade" && option.disponivel ? 0 : undefined}
                      onClick={() => {
                        if (category.tipo !== "quantidade" && option.disponivel) {
                          toggle(category, option.id);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (
                          category.tipo !== "quantidade"
                          && option.disponivel
                          && (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          toggle(category, option.id);
                        }
                      }}
                    >
                      <div><strong className="block">{option.nome}</strong>{option.produtoAdicionalNome && <small className="text-gray-500">Produto adicional</small>}</div>
                      <div className="flex items-center gap-3">
                        {category.mostrarPreco && option.preco > 0 && <b className="delivery-theme-accent">+{money(option.preco)}</b>}
                        {category.tipo === "quantidade" ? (
                          <div className="delivery-portion-control">
                            <Button type="button" variant="outline" size="icon" disabled={!option.disponivel || amount === 0} onClick={() => changeOptionQuantity(category, option.id, -1)}>−</Button>
                            <output aria-label={`Quantidade de ${option.nome}`}>{amount}</output>
                            <Button type="button" variant="outline" size="icon" disabled={!option.disponivel || amount >= category.maximoPorOpcao || selectedCount(category) >= category.maximo} onClick={() => changeOptionQuantity(category, option.id, 1)}>+</Button>
                          </div>
                        ) : (
                          <input
                            className="h-6 w-6"
                            type={category.tipo === "unica" ? "radio" : "checkbox"}
                            name={category.tipo === "unica" ? category.id : undefined}
                            disabled={!option.disponivel}
                            checked={isSelected}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => toggle(category, option.id)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <section><Label htmlFor="notes" className="text-lg font-black">Observações</Label><Textarea id="notes" maxLength={180} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex.: sem cebola, molho separado..." className="mt-2 min-h-28 text-base" /><p className="mt-1 text-right text-sm text-gray-500">{notes.length}/180</p></section>
          <section><h3 className="mb-3 text-lg font-black">Quantidade do produto</h3><div className="delivery-portion-control"><Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</Button><output>{quantity}</output><Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>+</Button></div></section>
        </div>

        <DialogFooter className="delivery-options-footer sticky -bottom-4 -mx-4 border-t p-4 shadow-[0_-10px_28px_rgba(0,0,0,.1)] sm:-bottom-6 sm:-mx-6 sm:p-6">
          <Button onClick={addToCart} className="btn-primary h-14 w-full text-base font-black">
            Adicionar · <span className="ml-1" aria-live="polite">{money(total)}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
