import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu, MessageCircle, User } from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificacoes } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  userType: "customer" | "staff" | "manager" | "delivery";
}

const perfilPath = (tipo?: string) => ({
  cliente: "/dashboard/cliente/perfil",
  funcionario: "/dashboard/funcionario/perfil",
  entregador: "/dashboard/entregador/perfil",
  gerente: "/dashboard/gerente/perfil",
}[tipo || ""] || "/dashboard/cliente/perfil");

const chatPath = (tipo: DashboardLayoutProps["userType"]) => ({
  customer: "/dashboard/cliente/chat",
  staff: "/dashboard/funcionario/chat",
  delivery: "/dashboard/entregador/chat",
  manager: "/dashboard/gerente/chat",
}[tipo]);

export const DashboardLayout = ({
  children,
  title = "Visão geral",
  userType,
}: DashboardLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsedState] = useState(
    () => localStorage.getItem("deliveryDashboardSidebar") === "collapsed",
  );
  const { notificacoes, marcarComoLida } = useNotificacoes();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const naoLidas = notificacoes.filter((item) => !item.lida).length;

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    localStorage.setItem(
      "deliveryDashboardSidebar",
      value ? "collapsed" : "expanded",
    );
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const fecharComEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", fecharComEsc);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      toast({
        title: "Não foi possível sair",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-desktop-sidebar">
        <DashboardSidebar
          userType={userType}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onLogout={handleLogout}
        />
      </div>

      {mobileMenuOpen && (
        <div
          className="dashboard-mobile-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <DashboardSidebar
            userType={userType}
            mobile
            onNavigate={() => setMobileMenuOpen(false)}
            onLogout={handleLogout}
          />
        </div>
      )}

      <section className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div className="dashboard-title-group">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="dashboard-menu-trigger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu />
            </Button>
            <div>
              <small>ÁREA DE TRABALHO</small>
              <h1>{title}</h1>
            </div>
          </div>

          <div className="dashboard-top-actions">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="dashboard-action-button">
                  <Bell />
                  {naoLidas > 0 && (
                    <Badge className="dashboard-notification-count">
                      {Math.min(naoLidas, 99)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dashboard-notifications">
                <div className="dashboard-dropdown-title">
                  <strong>Notificações</strong>
                  <span>{naoLidas} não lidas</span>
                </div>
                <DropdownMenuSeparator />
                {notificacoes.length === 0 ? (
                  <p className="dashboard-dropdown-empty">Nenhuma notificação.</p>
                ) : notificacoes.slice(0, 8).map((notificacao) => (
                  <DropdownMenuItem
                    key={notificacao.id}
                    className="dashboard-notification-item"
                    onClick={() => marcarComoLida(notificacao.id)}
                  >
                    <strong>{notificacao.titulo}</strong>
                    <span>{notificacao.mensagem}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="dashboard-profile-trigger">
                  <span>{user?.nome_completo?.slice(0, 1).toUpperCase() || <User />}</span>
                  <div>
                    <strong>{user?.nome_completo || "Usuário"}</strong>
                    <small>{user?.tipo_usuario}</small>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dashboard-profile-menu">
                <DropdownMenuItem onClick={() => navigate(perfilPath(user?.tipo_usuario))}>
                  <User /> Meu perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(chatPath(userType))}>
                  <MessageCircle /> Atendimento
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  Sair da conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="dashboard-content">
          <div className="dashboard-content-inner">{children}</div>
        </main>
      </section>
    </div>
  );
};
