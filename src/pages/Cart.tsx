import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ReceiptText, ShoppingBag, Tag, Trash2, Truck } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/stores/cartStore";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, updateQuantity, removeItem } = useCartStore();
  const { configuracao, loading, estaAberto } = useEstabelecimento();
  const [couponCode, setCouponCode] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const toNumber = (value: unknown): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."));
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + toNumber(item.totalPrice ?? item.price * item.quantity), 0),
    [items],
  );
  const freeShippingMinimum = toNumber(configuracao?.valor_minimo_frete_gratis);
  const deliveryFee = toNumber(configuracao?.taxa_entrega);
  const shipping = !configuracao || (freeShippingMinimum > 0 && subtotal >= freeShippingMinimum) ? 0 : deliveryFee;
  const total = subtotal + shipping;
  const remainingForFreeShipping = Math.max(0, freeShippingMinimum - subtotal);

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
    toast({ title: "Item removido", description: "O carrinho foi atualizado." });
  };

  const handleCheckout = () => {
    if (!estaAberto) {
      toast({ title: "Estabelecimento fechado", description: "No momento, não estamos aceitando novos pedidos.", variant: "destructive" });
      return;
    }
    if (items.length > 0) setIsCheckoutOpen(true);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    toast({ title: "Cupom não encontrado", description: "Confira o código informado e tente novamente.", variant: "destructive" });
    setCouponCode("");
  };

  const customizationLines = (customizations: unknown): string[] => {
    if (!customizations || typeof customizations !== "object") return [];
    const data = customizations as Record<string, unknown>;
    const lines: string[] = [];
    if (data.variations && typeof data.variations === "object") {
      Object.entries(data.variations as Record<string, { nome?: string }>).forEach(([type, variation]) => {
        if (variation?.nome) lines.push(`${type}: ${variation.nome}`);
      });
    }
    const selections = data.selections;
    if (selections && typeof selections === "object") {
      Object.values(selections as Record<string, unknown>).flat().forEach((selection) => {
        if (selection && typeof selection === "object" && "nome" in selection) {
          lines.push(String((selection as { nome: unknown }).nome));
        }
      });
    }
    if (typeof data.notes === "string" && data.notes.trim()) lines.push(`Obs.: ${data.notes}`);
    return lines;
  };

  return (
    <MainLayout>
      <div className="delivery-cart-page">
        <header className="delivery-cart-header">
          <button type="button" onClick={() => navigate("/")}><ArrowLeft /><span>Continuar comprando</span></button>
          <div><span className="delivery-auth-kicker">Seu pedido</span><h1>Carrinho</h1><p>{items.length} {items.length === 1 ? "item selecionado" : "itens selecionados"}</p></div>
        </header>

        {items.length === 0 ? (
          <section className="delivery-cart-empty">
            <div><ShoppingBag /></div>
            <span className="delivery-auth-kicker">Seu carrinho está esperando</span>
            <h2>Escolha algo gostoso</h2>
            <p>Adicione produtos do cardápio e volte aqui para concluir o pedido.</p>
            <Button className="btn-primary" onClick={() => navigate("/")}>Explorar cardápio</Button>
          </section>
        ) : (
          <div className="delivery-cart-layout">
            <section className="delivery-cart-items" aria-label="Itens do carrinho">
              {items.map((item, index) => {
                const details = customizationLines(item.customizations);
                const itemTotal = toNumber(item.totalPrice ?? item.price * item.quantity);
                return (
                  <article className="delivery-cart-item" key={`${item.id}-${index}-${JSON.stringify(item.customizations)}`}>
                    <img src={item.image || "/placeholder.svg"} alt="" onError={(event) => { event.currentTarget.src = "/placeholder.svg"; }} />
                    <div className="delivery-cart-item-main">
                      <div className="delivery-cart-item-title"><div><h2>{item.name}</h2><span>{money(item.price)} cada</span></div><button type="button" onClick={() => handleRemoveItem(item.id)} aria-label={`Remover ${item.name}`}><Trash2 /></button></div>
                      {details.length > 0 && <ul>{details.map((detail, detailIndex) => <li key={`${detail}-${detailIndex}`}>{detail}</li>)}</ul>}
                      <div className="delivery-cart-item-bottom">
                        <div className="delivery-cart-quantity" aria-label={`Quantidade de ${item.name}`}>
                          <button type="button" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Diminuir quantidade"><Minus /></button>
                          <output>{item.quantity}</output>
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Aumentar quantidade"><Plus /></button>
                        </div>
                        <strong>{money(itemTotal)}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="delivery-cart-summary">
              <header><ReceiptText /><div><h2>Resumo do pedido</h2><p>Confira antes de continuar</p></div></header>
              {freeShippingMinimum > 0 && (
                <div className={`delivery-shipping-progress ${remainingForFreeShipping === 0 ? "is-complete" : ""}`}>
                  <div><Truck /><span>{remainingForFreeShipping === 0 ? "Você ganhou frete grátis!" : `Faltam ${money(remainingForFreeShipping)} para frete grátis`}</span></div>
                  <progress max={freeShippingMinimum} value={Math.min(subtotal, freeShippingMinimum)} />
                </div>
              )}
              <div className="delivery-cart-coupon">
                <label htmlFor="coupon"><Tag /> Tem um cupom?</label>
                <div><Input id="coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Digite o código" /><Button variant="outline" onClick={handleApplyCoupon} disabled={!couponCode.trim()}>Aplicar</Button></div>
              </div>
              <dl>
                <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
                <div><dt>Entrega</dt><dd className={shipping === 0 ? "is-free" : ""}>{loading ? "Calculando" : shipping === 0 ? "Grátis" : money(shipping)}</dd></div>
                <div className="delivery-cart-total"><dt>Total</dt><dd>{loading ? "—" : money(total)}</dd></div>
              </dl>
              <Button className="delivery-cart-checkout btn-primary" onClick={handleCheckout} disabled={loading || !estaAberto}>
                {loading ? "Preparando pedido..." : estaAberto ? "Continuar para entrega e pagamento" : "Fechado no momento"}
              </Button>
              <p className="delivery-cart-secure">Você poderá escolher entrega ou retirada e a forma de pagamento na próxima etapa.</p>
            </aside>
          </div>
        )}
      </div>
      <CheckoutModal open={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} onFinishOrder={() => setIsCheckoutOpen(false)} />
    </MainLayout>
  );
};

export default Cart;
