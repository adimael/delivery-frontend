import { useEffect, useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";

export const FloatingCartButton = () => {
  const items = useCartStore(state => state.items);
  const navigate = useNavigate();
  const location = useLocation();
  const [animate, setAnimate] = useState(false);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.totalPrice ?? item.price * item.quantity), 0),
    [items]
  );

  useEffect(() => {
    if (!count) return;
    setAnimate(true);
    const timer = window.setTimeout(() => setAnimate(false), 500);
    return () => window.clearTimeout(timer);
  }, [count]);

  if (!count || location.pathname === "/cart") return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/cart")}
      aria-label={`Abrir carrinho com ${count} itens`}
      className={`delivery-floating-cart ${animate ? "scale-105" : ""}`}
    >
      <span className="flex items-center gap-3">
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-1 text-sm font-bold text-gray-900">
            {count}
          </span>
        </span>
        <span className="text-left">
          <span className="block text-base font-bold">Ver carrinho</span>
          <span className="block text-xs text-white/90">Seu produto foi adicionado</span>
        </span>
      </span>
      <span className="ml-4 text-lg font-extrabold">
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}
      </span>
    </button>
  );
};
