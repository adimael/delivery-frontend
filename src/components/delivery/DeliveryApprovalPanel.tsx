import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, MapPin, ShieldCheck, Truck, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { startSmartPolling } from "@/lib/smartPolling";
import {
  isRealtimeConnected,
  subscribeRealtime,
  subscribeRealtimeState,
} from "@/lib/realtime";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type DeliveryRequest = {
  id: string;
  pedido_uuid: string;
  numero_pedido: string;
  entregador_nome: string;
  entregador_telefone?: string;
  endereco_entrega: string;
  taxa_entrega: number | string;
  criado_em: string;
};

export function DeliveryApprovalPanel() {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const data = await apiRequest("/equipe/solicitacoes-entrega?status=pendente");
    setRequests(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    void load();
    const unsubscribeEvent = subscribeRealtime("delivery.delivery-requests.updated", () => {
      void load();
    });
    const unsubscribeState = subscribeRealtimeState((online) => {
      if (online) void load();
    });
    const stopFallback = startSmartPolling(
      () => (isRealtimeConnected() ? undefined : load()),
      { activeInterval: 45_000, hiddenInterval: 2 * 60_000 },
    );
    return () => {
      unsubscribeEvent();
      unsubscribeState();
      stopFallback();
    };
  }, [load]);

  const decide = async (id: string, decisao: "aprovada" | "rejeitada") => {
    setProcessing(id);
    try {
      await apiRequest(`/equipe/solicitacoes-entrega/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ decisao }),
      });
      setRequests((current) => current.filter((request) => request.id !== id));
      toast({
        title: decisao === "aprovada" ? "Entrega autorizada" : "Solicitação rejeitada",
        description: decisao === "aprovada"
          ? "O pedido foi atribuído ao entregador selecionado."
          : "O pedido continua disponível para outros entregadores.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível analisar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
      await load();
    } finally {
      setProcessing(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <section className="delivery-approval-panel">
      <header>
        <div><ShieldCheck /><span><strong>Autorizações de entrega</strong><small>Confirme a identidade antes de liberar os dados do pedido.</small></span></div>
        <Badge>{requests.length} pendente{requests.length > 1 ? "s" : ""}</Badge>
      </header>
      <div className="delivery-approval-list">
        {requests.map((request) => (
          <article key={request.id}>
            <div className="delivery-approval-person">
              <span><Truck /></span>
              <div><strong>{request.entregador_nome}</strong><small>{request.entregador_telefone || "Telefone não informado"}</small></div>
            </div>
            <div className="delivery-approval-order">
              <strong>Pedido #{request.numero_pedido}</strong>
              <span><MapPin /> {request.endereco_entrega}</span>
              <span><Clock3 /> Solicitado em {new Date(request.criado_em).toLocaleString("pt-BR")}</span>
            </div>
            <div className="delivery-approval-actions">
              <Button onClick={() => void decide(request.id, "aprovada")} disabled={processing === request.id}>
                <Check /> Autorizar
              </Button>
              <Button variant="outline" onClick={() => void decide(request.id, "rejeitada")} disabled={processing === request.id}>
                <X /> Rejeitar
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
