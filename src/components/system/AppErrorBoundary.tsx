import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Mantém detalhes técnicos fora da interface, mas disponíveis ao monitoramento.
    window.dispatchEvent(new CustomEvent("delivery:ui-error", {
      detail: { message: error.message, componentStack: info.componentStack },
    }));
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="app-error-boundary">
        <span><AlertTriangle /></span>
        <h1>Não foi possível exibir esta área</h1>
        <p>Seus dados foram preservados. Atualize a interface para tentar novamente.</p>
        <Button onClick={() => window.location.reload()}><RefreshCw /> Atualizar interface</Button>
      </main>
    );
  }
}
