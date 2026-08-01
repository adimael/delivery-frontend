import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, ChefHat, Minus, Plus, ReceiptText, ShoppingBag, Store, Tag, Trash2, Truck } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/stores/cartStore";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const RECENT_ORDER_KEY = "deliveryRecentOrder";
const RECENT_ORDER_TTL = 24 * 60 * 60 * 1000;

interface RecentOrderConfirmation {
  numero: string;
  criadoEm: string;
}

const readRecentOrder = (): RecentOrderConfirmation | null => {
  try {
    const saved = window.localStorage.getItem(RECENT_ORDER_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<RecentOrderConfirmation>;
    const createdAt = Date.parse(String(parsed.criadoEm || ""));
    if (!parsed.numero || !Number.isFinite(createdAt) || Date.now() - createdAt > RECENT_ORDER_TTL) {
      window.localStorage.removeItem(RECENT_ORDER_KEY);
      return null;
    }

    return { numero: String(parsed.numero), criadoEm: String(parsed.criadoEm) };
  } catch {
    return null;
  }
};

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem } = useCartStore();
  const { configuracao, loading, estaAberto } = useEstabelecimento();
  const [couponCode, setCouponCode] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<"entrega" | "retirada">("entrega");
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [cupomAplicado, setCupomAplicado] = useState<{
    codigo: string;
    desconto: number;
    descricao?: string;
    frete_gratis?: boolean;
  } | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [recentOrder, setRecentOrder] = useState<RecentOrderConfirmation | null>(readRecentOrder);

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
  const minimoFreteGratis = toNumber(configuracao?.valor_minimo_frete_gratis);
  const taxaEntrega = tipoEntrega === "entrega"
    && !cupomAplicado?.frete_gratis
    && !(minimoFreteGratis > 0 && subtotal >= minimoFreteGratis)
    ? toNumber(configuracao?.taxa_entrega)
    : 0;
  const desconto = cupomAplicado?.desconto || 0;
  const total = Math.max(0, subtotal + taxaEntrega - desconto);
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

  const handleFinishedOrder = (order: Record<string, unknown>) => {
    const confirmation = {
      numero: String(order.numero_pedido || order.id || ""),
      criadoEm: new Date().toISOString(),
    };

    if (confirmation.numero) {
      window.localStorage.setItem(RECENT_ORDER_KEY, JSON.stringify(confirmation));
      setRecentOrder(confirmation);
    }
    setIsCheckoutOpen(false);
  };

  const dismissRecentOrder = () => {
    window.localStorage.removeItem(RECENT_ORDER_KEY);
    setRecentOrder(null);
    navigate("/");
  };

  const handleApplyCoupon = async () => {
    const codigo = couponCode.trim().toUpperCase();
    if (!codigo || validandoCupom) return;

    setValidandoCupom(true);
    try {
      const resultado = await apiRequest(user ? "/cupons/validar-autenticado" : "/cupons/validar", {
        method: "POST",
        body: JSON.stringify({
          codigo,
          subtotal,
          itens: items.map((item) => ({
            produto_id: item.id,
            total: item.totalPrice ?? item.price * item.quantity,
          })),
        }),
      });
      if (resultado.exige_cadastro && !user) {
        throw new Error("Este cupom é exclusivo para clientes cadastrados.");
      }
      const codigoValidado = String(resultado.codigo || codigo).toUpperCase();
      setCouponCode(codigoValidado);
      setCupomAplicado({
        codigo: codigoValidado,
        desconto: toNumber(resultado.desconto),
        descricao: typeof resultado.descricao === "string" ? resultado.descricao : undefined,
        frete_gratis: resultado.frete_gratis === true || Number(resultado.frete_gratis ?? 0) === 1,
      });
      const freteGratis = resultado.frete_gratis === true || Number(resultado.frete_gratis ?? 0) === 1;
      toast({ title: "Cupom aplicado", description: `Você ganhou ${money(toNumber(resultado.desconto))} de desconto${freteGratis ? " e frete grátis" : ""}.` });
    } catch (error) {
      setCupomAplicado(null);
      toast({
        title: "Cupom não aplicado",
        description: error instanceof Error ? error.message : "Confira o código e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setValidandoCupom(false);
    }
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
          recentOrder ? (
            <section
              className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-xl shadow-emerald-950/5 sm:p-9"
              role="status"
            >
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
                <CheckCircle2 className="h-11 w-11" aria-hidden="true" />
              </div>
              <span className="mt-5 block text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                Pedido #{recentOrder.numero}
              </span>
              <h2 className="mt-2 text-3xl font-black text-emerald-950">Pedido recebido!</h2>
              <p className="mx-auto mt-3 max-w-lg text-lg leading-relaxed text-emerald-900">
                O estabelecimento recebeu seu pedido e ele já está em produção. Guarde o número acima para identificação.
              </p>
              <ol className="mt-6 grid gap-3 text-left sm:grid-cols-3" aria-label="Andamento inicial do pedido">
                <li className="flex items-center gap-2 rounded-2xl bg-white/80 p-3 font-bold"><Check className="h-5 w-5 text-emerald-600" />Enviado</li>
                <li className="flex items-center gap-2 rounded-2xl bg-white/80 p-3 font-bold"><Check className="h-5 w-5 text-emerald-600" />Recebido</li>
                <li className="flex items-center gap-2 rounded-2xl bg-white/80 p-3 font-bold"><ChefHat className="h-5 w-5 text-emerald-600" />Em produção</li>
              </ol>
              <Button className="btn-primary mt-7 min-h-12 w-full sm:w-auto" onClick={dismissRecentOrder}>
                Voltar ao cardápio
              </Button>
            </section>
          ) : (
          <section className="delivery-cart-empty">
            <div><ShoppingBag /></div>
            <span className="delivery-auth-kicker">Seu carrinho está esperando</span>
            <h2>Escolha algo gostoso</h2>
            <p>Adicione produtos do cardápio e volte aqui para concluir o pedido.</p>
            <Button className="btn-primary" onClick={() => navigate("/")}>Explorar cardápio</Button>
          </section>
          )
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
              <section className="delivery-cart-delivery-type" aria-labelledby="delivery-type-title">
                <div><span>Como deseja receber?</span><h2 id="delivery-type-title">Tipo de entrega</h2></div>
                <div role="radiogroup" aria-label="Tipo de entrega">
                  <button type="button" role="radio" aria-checked={tipoEntrega === "entrega"} className={tipoEntrega === "entrega" ? "is-selected" : ""} onClick={() => setTipoEntrega("entrega")}>
                    <Truck /><span><strong>Entrega</strong><small>Receber no endereço</small></span>
                  </button>
                  <button type="button" role="radio" aria-checked={tipoEntrega === "retirada"} className={tipoEntrega === "retirada" ? "is-selected" : ""} onClick={() => setTipoEntrega("retirada")}>
                    <Store /><span><strong>Retirada</strong><small>Buscar no estabelecimento</small></span>
                  </button>
                </div>
              </section>
              <header><ReceiptText /><div><h2>Resumo do pedido</h2><p>Confira antes de continuar</p></div></header>
              <div className="delivery-cart-coupon">
                <label htmlFor="coupon"><Tag /> Tem um cupom?</label>
                <div><Input id="coupon" value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setCupomAplicado(null); }} placeholder="Digite o código" /><Button variant="outline" onClick={() => void handleApplyCoupon()} disabled={!couponCode.trim() || validandoCupom}>{validandoCupom ? "Validando" : "Aplicar"}</Button></div>
                {cupomAplicado && <p className="delivery-cart-coupon-success">Cupom {cupomAplicado.codigo} aplicado{cupomAplicado.frete_gratis ? " com frete grátis" : ""}.</p>}
              </div>
              <dl>
                <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
                <div><dt>{tipoEntrega === "entrega" ? "Taxa de entrega" : "Retirada no local"}</dt><dd className={taxaEntrega === 0 ? "is-free" : ""}>{taxaEntrega === 0 ? "Grátis" : money(taxaEntrega)}</dd></div>
                {cupomAplicado && <div className="delivery-cart-discount"><dt>Desconto</dt><dd>-{money(desconto)}</dd></div>}
                <div className="delivery-cart-total"><dt>Total</dt><dd>{loading ? "—" : money(total)}</dd></div>
              </dl>
              <Button className="delivery-cart-checkout btn-primary" onClick={handleCheckout} disabled={loading || !estaAberto}>
                {loading ? "Preparando pedido..." : estaAberto ? "Continuar para entrega e pagamento" : "Fechado no momento"}
              </Button>
              <p className="delivery-cart-secure">Você pode alterar o tipo acima. O servidor confirmará os valores ao finalizar.</p>
            </aside>
          </div>
        )}
      </div>
      <CheckoutModal
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onFinishOrder={handleFinishedOrder}
        onCartAdjusted={() => {
          setCupomAplicado(null);
          setCouponCode("");
        }}
        tipoEntregaInicial={tipoEntrega}
        cupomInicial={cupomAplicado}
      />
    </MainLayout>
  );
};

export default Cart;
