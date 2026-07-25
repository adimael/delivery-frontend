import { NavLink } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Settings,
  ShoppingBag,
  Ticket,
  Truck,
  User,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";

type DashboardUserType = "customer" | "staff" | "delivery" | "manager";

interface DashboardSidebarProps {
  userType: DashboardUserType;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  mobile?: boolean;
  onNavigate?: () => void;
  onLogout: () => void;
}

const linksPorPerfil = {
  customer: [
    ["/dashboard/cliente", LayoutDashboard, "Visão geral"],
    ["/dashboard/cliente/pedidos", ShoppingBag, "Meus pedidos"],
    ["/dashboard/cliente/chat", MessageCircle, "Atendimento"],
    ["/dashboard/cliente/perfil", User, "Meu perfil"],
  ],
  staff: [
    ["/dashboard/funcionario", LayoutDashboard, "Visão geral"],
    ["/dashboard/funcionario/pedidos", ShoppingBag, "Pedidos"],
    ["/dashboard/funcionario/chat", MessageCircle, "Atendimento"],
    ["/dashboard/funcionario/perfil", User, "Meu perfil"],
  ],
  delivery: [
    ["/dashboard/entregador", LayoutDashboard, "Visão geral"],
    ["/dashboard/entregador/disponivel", Truck, "Disponíveis"],
    ["/dashboard/entregador/entregas", ShoppingBag, "Minhas entregas"],
    ["/dashboard/entregador/ganhos", BarChart3, "Meus ganhos"],
    ["/dashboard/entregador/chat", MessageCircle, "Atendimento"],
    ["/dashboard/entregador/perfil", User, "Meu perfil"],
  ],
  manager: [
    ["/dashboard/gerente", LayoutDashboard, "Visão geral"],
    ["/dashboard/gerente/pedidos", ShoppingBag, "Pedidos"],
    ["/dashboard/gerente/produtos", Package, "Produtos"],
    ["/dashboard/gerente/categorias", Package, "Categorias"],
    ["/dashboard/gerente/funcionarios", Users, "Funcionários"],
    ["/dashboard/gerente/entregadores", Truck, "Entregadores"],
    ["/dashboard/gerente/relatorios", BarChart3, "Relatórios"],
    ["/dashboard/gerente/cupons", Ticket, "Cupons"],
    ["/dashboard/gerente/configuracoes", Settings, "Configurações"],
    ["/dashboard/gerente/chat", MessageCircle, "Atendimento"],
    ["/dashboard/gerente/perfil", User, "Meu perfil"],
  ],
} satisfies Record<
  DashboardUserType,
  Array<readonly [string, typeof LayoutDashboard, string]>
>;

export const DashboardSidebar = ({
  userType,
  collapsed = false,
  setCollapsed,
  mobile = false,
  onNavigate,
  onLogout,
}: DashboardSidebarProps) => {
  const { user } = useAuth();
  const { configuracao } = useEstabelecimento();
  const platformName = configuracao?.nome_plataforma || "Meu Delivery";
  const logo = configuracao?.url_icone_plataforma;
  const compacta = collapsed && !mobile;

  return (
    <aside
      className={cn(
        "dashboard-sidebar",
        compacta && "is-collapsed",
        mobile && "is-mobile",
      )}
      aria-label="Navegação do painel"
    >
      <div className="dashboard-sidebar-brand">
        <div className="dashboard-sidebar-logo" aria-hidden="true">
          {logo
            ? <img src={logo} alt="" />
            : <span>{platformName.slice(0, 1).toUpperCase()}</span>}
        </div>
        {!compacta && (
          <div className="dashboard-sidebar-brand-copy">
            <strong>{platformName}</strong>
            <small>Painel operacional</small>
          </div>
        )}
        {mobile && (
          <button type="button" onClick={onNavigate} aria-label="Fechar menu">
            <X />
          </button>
        )}
      </div>

      {!compacta && (
        <div className="dashboard-sidebar-user">
          <span>{user?.nome_completo?.slice(0, 1).toUpperCase() || "U"}</span>
          <div>
            <strong>{user?.nome_completo || "Usuário"}</strong>
            <small>{user?.tipo_usuario || userType}</small>
          </div>
        </div>
      )}

      <nav className="dashboard-sidebar-nav">
        {!compacta && <p>MENU PRINCIPAL</p>}
        {linksPorPerfil[userType].map(([to, Icon, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to.split("/").length === 3}
            onClick={onNavigate}
            title={compacta ? label : undefined}
            className={({ isActive }) => cn(isActive && "is-active")}
          >
            <Icon aria-hidden="true" />
            {!compacta && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="dashboard-sidebar-bottom">
        {!mobile && setCollapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={compacta ? "Expandir menu" : "Recolher menu"}
          >
            {compacta ? <ChevronRight /> : <ChevronLeft />}
            {!compacta && <span>Recolher menu</span>}
          </button>
        )}
        <button type="button" onClick={onLogout} className="is-danger">
          <LogOut />
          {!compacta && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};
