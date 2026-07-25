import { BookOpen, LogIn, Search, ShoppingBag, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/stores/cartStore";

interface MainNavbarProps {
  onSearch?: () => void;
}

export const MainNavbar = ({ onSearch }: MainNavbarProps) => {
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const location = useLocation();
  const navigate = useNavigate();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const dashboardPath = user
    ? `/dashboard/${user.tipo_usuario}`
    : "/login";

  const search = () => {
    if (location.pathname !== "/") {
      navigate("/#buscar");
      return;
    }
    onSearch?.();
  };

  return (
    <>
      <header className="delivery-topbar">
        <div className="delivery-topbar-inner">
          <Logo />
          <div className="delivery-desktop-actions">
            <button type="button" onClick={search}><Search /> Buscar</button>
            <Link to="/cart"><ShoppingBag /> Carrinho {itemCount > 0 && <b>{itemCount}</b>}</Link>
            <Link className="primary" to={dashboardPath}>
              {user ? <UserRound /> : <LogIn />}
              {user ? "Minha conta" : "Entrar"}
            </Link>
          </div>
        </div>
      </header>

      <nav className="delivery-bottom-nav" aria-label="Navegação principal">
        <Link className={location.pathname === "/" ? "active" : ""} to="/">
          <BookOpen /><span>Cardápio</span>
        </Link>
        <button type="button" onClick={search}>
          <Search /><span>Busca</span>
        </button>
        <Link className={location.pathname === "/cart" ? "active" : ""} to="/cart">
          <span className="delivery-nav-icon"><ShoppingBag />{itemCount > 0 && <b>{itemCount}</b>}</span>
          <span>Carrinho</span>
        </Link>
        <Link className={location.pathname === "/login" ? "active" : ""} to={dashboardPath}>
          {user ? <UserRound /> : <LogIn />}
          <span>{user ? "Conta" : "Entrar"}</span>
        </Link>
      </nav>
    </>
  );
};
