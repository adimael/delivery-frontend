import { useEffect, useState } from "react";
import { HealthStatus, checkSystemHealth, waitForHealthySystem } from "@/lib/healthCheck";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

const SystemError = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [autoRetry, setAutoRetry] = useState(true);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const status = await checkSystemHealth();
      setHealthStatus(status);
    } catch (error) {
      console.error("Health check failed:", error);
      setHealthStatus({
        status: "error",
        timestamp: new Date().toISOString(),
        services: {
          database: "unknown",
          backend: "error"
        },
        message: "Failed to check system health"
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Auto-check health every 10 seconds if auto-retry is enabled
    if (autoRetry) {
      const interval = setInterval(() => {
        checkHealth();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [autoRetry]);

  const handleRetry = async () => {
    await checkHealth();
    
    // If system is healthy, reload the page to go back to normal operation
    if (healthStatus?.status === "ok") {
      window.location.reload();
    }
  };

  const handleAutoRetryToggle = () => {
    setAutoRetry(!autoRetry);
  };

  const getServiceStatus = (service: string) => {
    if (!healthStatus) return "unknown";
    
    switch (healthStatus.services[service as keyof typeof healthStatus.services]) {
      case "connected":
      case "running":
        return "Operacional";
      case "disconnected":
      case "unreachable":
      case "timeout":
      case "error":
        return "Com problemas";
      default:
        return "Desconhecido";
    }
  };

  const getErrorMessage = () => {
    if (!healthStatus) return "Não foi possível determinar o status do sistema.";
    
    if (healthStatus.message) {
      return healthStatus.message;
    }
    
    if (healthStatus.services.backend === "unreachable") {
      return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
    }
    
    if (healthStatus.services.database === "disconnected") {
      return "O servidor está funcionando, mas não foi possível conectar ao banco de dados.";
    }
    
    return "O sistema está enfrentando problemas técnicos. Por favor, tente novamente mais tarde.";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Problemas de Conectividade</h1>
          <p className="mt-2 text-gray-600">
            Estamos enfrentando dificuldades para conectar aos nossos serviços.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800">Detalhes do Problema</h3>
          <p className="mt-1 text-sm text-red-700">{getErrorMessage()}</p>
          
          {healthStatus && (
            <div className="mt-3 text-xs text-red-600">
              <p>Última verificação: {new Date(healthStatus.timestamp).toLocaleTimeString()}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Status do Backend:</span>
            <span className={`text-sm font-medium ${
              healthStatus?.services?.backend === "running" ? "text-green-600" : "text-red-600"
            }`}>
              {getServiceStatus("backend")}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Status do Banco de Dados:</span>
            <span className={`text-sm font-medium ${
              healthStatus?.services?.database === "connected" ? "text-green-600" : "text-red-600"
            }`}>
              {getServiceStatus("database")}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleRetry}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? "Verificando..." : "Tentar Novamente"}
          </Button>
          
          <button
            onClick={handleAutoRetryToggle}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {autoRetry 
              ? "Desativar tentativas automáticas" 
              : "Ativar tentativas automáticas"}
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Se o problema persistir, entre em contato com nosso suporte técnico.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemError;