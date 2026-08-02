import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ConfirmationHost } from "@/components/ui/confirmation-host";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardRedirect } from "@/components/auth/DashboardRedirect";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Cart from "@/pages/Cart";
import ProductDetail from "@/pages/ProductDetail";
import Tutorial from "@/pages/Tutorial";
import NotFound from "@/pages/NotFound";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { applyPlatformTheme, updateDocumentTitle } from "@/lib/themeUtils";
import SystemError from "@/pages/SystemError";
import { checkSystemHealth } from "@/lib/healthCheck";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

// Customer Dashboard
import CustomerDashboard from "@/pages/dashboard/CustomerDashboard";
import CustomerOrders from "@/pages/dashboard/CustomerOrders";
import CustomerProfile from "@/pages/dashboard/CustomerProfile";
import CustomerChat from "@/pages/dashboard/CustomerChat";

// Staff Dashboard
import StaffDashboard from "@/pages/dashboard/StaffDashboard";
import StaffOrders from "@/pages/dashboard/StaffOrders";
import StaffProfile from "@/pages/dashboard/StaffProfile";
import Chat from "@/pages/dashboard/Chat";

// Delivery Dashboard
import DeliveryDashboard from "@/pages/dashboard/DeliveryDashboard";
import DeliveryAvailable from "@/pages/dashboard/DeliveryAvailable";
import DeliveryMyOrders from "@/pages/dashboard/DeliveryMyOrders";
import DeliveryGains from "@/pages/dashboard/DeliveryGains";
import DeliveryProfile from "@/pages/dashboard/DeliveryProfile";
import DeliveryChat from "@/pages/dashboard/DeliveryChat";

// Manager Dashboard
import ManagerDashboard from "@/pages/dashboard/ManagerDashboard";
import ManagerOrders from "@/pages/dashboard/ManagerOrders";
import ManagerProducts from "@/pages/dashboard/ManagerProducts";
import ManagerCategories from "@/pages/dashboard/ManagerCategories";
import ManagerStaff from "@/pages/dashboard/ManagerStaff";
import ManagerDelivery from "@/pages/dashboard/ManagerDelivery";
import ManagerReports from "@/pages/dashboard/ManagerReports";
import ManagerSettings from "@/pages/dashboard/ManagerSettings";
import ManagerProfile from "@/pages/dashboard/ManagerProfile";
import ManagerChat from "@/pages/dashboard/ManagerChat";
import ManagerCoupons from "@/pages/dashboard/ManagerCoupons";

// Invoice Validation
import { InvoiceValidation } from "@/pages/InvoiceValidation";

const queryClient = new QueryClient();

function App() {
  const { configuracao, loading } = useEstabelecimento();
  const [systemHealthy, setSystemHealthy] = useState<boolean | null>(null);
  const [healthChecked, setHealthChecked] = useState(false);

  // Create a stable reference to the configuration values
  const configValues = useMemo(() => {
    return configuracao ? {
      nome_plataforma: configuracao.nome_plataforma,
      cor_primaria: configuracao.cor_primaria,
      cor_secundaria: configuracao.cor_secundaria,
      cor_navbar: configuracao.cor_navbar,
      cor_footer: configuracao.cor_footer,
      cor_section_header: configuracao.cor_section_header,
      cor_section_produtos: configuracao.cor_section_produtos,
      cor_section_comprar: configuracao.cor_section_comprar,
      cor_section_contato: configuracao.cor_section_contato,
      cor_botoes: configuracao.cor_botoes,
      cor_icones: configuracao.cor_icones
    } : null;
  }, [configuracao]);

  // Check system health on app startup
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkSystemHealth();
        setSystemHealthy(health.status === 'ok');
      } catch (error) {
        console.error('Health check failed:', error);
        setSystemHealthy(false);
      } finally {
        setHealthChecked(true);
      }
    };

    checkHealth();
  }, []);

  useEffect(() => {
    if (configValues) {
      applyPlatformTheme(configValues);
      // Update document title immediately when config is available
      updateDocumentTitle(configValues.nome_plataforma);
    }
  }, [configValues]);

  // Show health check loading state
  if (!healthChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show system error page if health check failed
  if (
    systemHealthy === false
    && import.meta.env.VITE_STRICT_HEALTH_CHECK === "true"
  ) {
    return (
      <QueryClientProvider client={queryClient}>
        <SystemError />
      </QueryClientProvider>
    );
  }

  // Show a loading state while fetching configuration for the first time
  // But don't block rendering completely to avoid flash of unstyled content
  if (loading && !configuracao) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Compatibilidade com links emitidos antes da padronização da rota. */}
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/validate-invoice/:orderId" element={<InvoiceValidation />} />

            {/* Dashboard Redirect Route */}
            <Route path="/dashboard-redirect" element={<DashboardRedirect />} />

            {/* Cliente Dashboard Routes */}
            <Route
              path="/dashboard/cliente"
              element={
                <ProtectedRoute tiposPermitidos={["cliente"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/cliente/pedidos"
              element={
                <ProtectedRoute tiposPermitidos={["cliente"]}>
                  <CustomerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/cliente/perfil"
              element={
                <ProtectedRoute tiposPermitidos={["cliente"]}>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/cliente/chat"
              element={
                <ProtectedRoute tiposPermitidos={["cliente"]}>
                  <CustomerChat />
                </ProtectedRoute>
              }
            />

            {/* Funcionário Dashboard Routes */}
            <Route
              path="/dashboard/funcionario"
              element={
                <ProtectedRoute tiposPermitidos={["funcionario"]}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/funcionario/pedidos"
              element={
                <ProtectedRoute tiposPermitidos={["funcionario"]}>
                  <StaffOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/funcionario/perfil"
              element={
                <ProtectedRoute tiposPermitidos={["funcionario"]}>
                  <StaffProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/funcionario/chat"
              element={
                <ProtectedRoute tiposPermitidos={["funcionario"]}>
                  <Chat userType="staff" />
                </ProtectedRoute>
              }
            />

            {/* Entregador Dashboard Routes */}
            <Route
              path="/dashboard/entregador"
              element={
                <ProtectedRoute tiposPermitidos={["entregador"]}>
                  <DeliveryDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/entregador/disponivel"
              element={
                <ProtectedRoute tiposPermitidos={["entregador"]}>
                  <DeliveryAvailable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/entregador/entregas"
              element={
                <ProtectedRoute tiposPermitidos={["entregador"]}>
                  <DeliveryMyOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/entregador/ganhos"
              element={
                <ProtectedRoute tiposPermitidos={["entregador"]}>
                  <DeliveryGains />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/entregador/perfil"
              element={
                <ProtectedRoute tiposPermitidos={["entregador"]}>
                  <DeliveryProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/entregador/chat"
              element={
                <ProtectedRoute tiposPermitidos={["entregador"]}>
                  <DeliveryChat />
                </ProtectedRoute>
              }
            />

            {/* Gerente Dashboard Routes */}
            <Route
              path="/dashboard/gerente"
              element={
                <ProtectedRoute tiposPermitidos={["gerente"]}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gerente/pedidos"
              element={
                <ProtectedRoute tiposPermitidos={["gerente"]}>
                  <ManagerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gerente/produtos"
              element={
                <ProtectedRoute tiposPermitidos={["gerente"]}>
                  <ManagerProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gerente/categorias"
              element={
                <ProtectedRoute tiposPermitidos={["gerente"]}>
                  <ManagerCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gerente/funcionarios"
              element={
                <ProtectedRoute tiposPermitidos={["gerente"]}>
                  <ManagerStaff />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gerente/entregadores"
              element={
                <ProtectedRoute tiposPermitidos={["gerente"]}>
                  <ManagerDelivery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gerente/relatorios"
              element={
                <ProtectedRoute tiposPermitidos={["gerente"]}>
                  <ManagerReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gerente/configuracoes"
              element={
                <ProtectedRoute tiposPermitidos={["gerente"]}>
                  <ManagerSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gerente/cupons"
              element={
                <ProtectedRoute tiposPermitidos={["gerente"]}>
                  <ManagerCoupons />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gerente/perfil"
              element={
                <ProtectedRoute tiposPermitidos={["gerente"]}>
                  <ManagerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/gerente/chat"
              element={
                <ProtectedRoute tiposPermitidos={["gerente"]}>
                  <ManagerChat />
                </ProtectedRoute>
              }
            />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <ConfirmationHost />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
