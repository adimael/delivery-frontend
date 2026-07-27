import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import { startSmartPolling } from '@/lib/smartPolling';
import {
  isRealtimeConnected,
  subscribeRealtime,
  subscribeRealtimeState,
} from '@/lib/realtime';
import { Headphones, MessageCircle, Send, User } from 'lucide-react';

interface Conversa {
  id: string;
  uuid?: string;
  assunto?: string | null;
  cliente_nome?: string;
  status: string;
  atendente_uuid?: string | null;
  atualizado_em?: string;
  criado_em?: string;
}

interface Mensagem {
  id: string;
  mensagem: string;
  criado_em: string;
  remetente_uuid: string;
  remetente_nome?: string;
  remetente_tipo?: string;
}

interface ChatProps {
  userType: 'customer' | 'staff' | 'delivery' | 'manager';
}

const Chat = ({ userType }: ChatProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtual, setConversaAtual] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iniciador = user?.tipo_usuario === 'cliente' || user?.tipo_usuario === 'entregador';

  const carregarMensagens = useCallback(async (conversaId: string) => {
    const data = await apiRequest(`/chat/${conversaId}/mensagens`);
    setMensagens(Array.isArray(data) ? data.map((item) => ({
      id: String(item.id ?? item.uuid),
      mensagem: String(item.mensagem ?? ''),
      criado_em: String(item.criado_em ?? new Date().toISOString()),
      remetente_uuid: String(item.remetente_uuid ?? ''),
      remetente_nome: item.remetente_nome,
      remetente_tipo: item.remetente_tipo,
    })) : []);
  }, []);

  const selecionarConversa = useCallback(async (id: string, atribuir = false) => {
    try {
      if (atribuir && user?.tipo_usuario !== 'gerente') {
        await apiRequest(`/chat/${id}/atendente`, { method: 'POST', body: '{}' });
      }
      setConversaAtual(id);
      await carregarMensagens(id);
    } catch {
      toast({
        title: 'Conversa indisponível',
        description: 'Ela pode ter sido assumida por outro atendente.',
        variant: 'destructive',
      });
    }
  }, [carregarMensagens, toast, user?.tipo_usuario]);

  const carregarConversas = useCallback(async () => {
    if (!user) return;
    try {
      let data = await apiRequest('/chat');
      if (iniciador && (!Array.isArray(data) || data.length === 0)) {
        const criada = await apiRequest('/chat', {
          method: 'POST',
          body: JSON.stringify({
            assunto: user.tipo_usuario === 'entregador'
              ? 'Suporte ao entregador'
              : 'Atendimento ao cliente',
          }),
        });
        data = [criada];
      }
      const lista: Conversa[] = Array.isArray(data) ? data.map((item) => ({
        ...item,
        id: String(item.id ?? item.uuid),
      })) : [];
      setConversas(lista);

      const atualAindaExiste = lista.some((item) => item.id === conversaAtual);
      if (!atualAindaExiste && iniciador && lista[0]) {
        setConversaAtual(lista[0].id);
        await carregarMensagens(lista[0].id);
      } else if (conversaAtual) {
        await carregarMensagens(conversaAtual);
      }
    } catch {
      setConversas([]);
    } finally {
      setCarregando(false);
    }
  }, [carregarMensagens, conversaAtual, iniciador, user]);

  useEffect(() => {
    if (!user) return;
    void carregarConversas();
    const unsubscribeEvent = subscribeRealtime('delivery.chat.updated', () => {
      void carregarConversas();
    });
    const unsubscribeState = subscribeRealtimeState((online) => {
      if (online) void carregarConversas();
    });
    const stopFallback = startSmartPolling(() => (
      isRealtimeConnected() ? undefined : carregarConversas()
    ), {
      activeInterval: 30_000,
      hiddenInterval: 2 * 60_000,
      maxInterval: 5 * 60_000,
    });

    return () => {
      unsubscribeEvent();
      unsubscribeState();
      stopFallback();
    };
  }, [carregarConversas, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviarMensagem = async (event: FormEvent) => {
    event.preventDefault();
    const texto = novaMensagem.trim();
    if (!texto || !conversaAtual || enviando) return;
    setEnviando(true);
    try {
      await apiRequest(`/chat/${conversaAtual}/mensagens`, {
        method: 'POST',
        body: JSON.stringify({ mensagem: texto }),
      });
      setNovaMensagem('');
      await carregarMensagens(conversaAtual);
    } catch {
      toast({
        title: 'Mensagem não enviada',
        description: 'Confira sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setEnviando(false);
    }
  };

  const titulo = {
    customer: 'Chat — Suporte',
    staff: 'Chat — Atendimento',
    delivery: 'Chat — Entregador',
    manager: 'Chat — Gerência',
  }[userType];

  return (
    <DashboardLayout title={titulo} userType={userType}>
      <div className="grid min-h-[calc(100dvh-10rem)] gap-4 lg:grid-cols-[minmax(230px,30%)_1fr]">
        {!iniciador && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5" /> Conversas
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[32dvh] space-y-2 overflow-y-auto lg:max-h-[calc(100dvh-16rem)]">
              {conversas.map((conversa) => (
                <button
                  key={conversa.id}
                  type="button"
                  onClick={() => void selecionarConversa(
                    conversa.id,
                    !conversa.atendente_uuid,
                  )}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    conversaAtual === conversa.id
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-muted'
                  }`}
                >
                  <strong className="block truncate">
                    {conversa.cliente_nome || conversa.assunto || 'Atendimento'}
                  </strong>
                  <span className="text-sm text-muted-foreground">
                    {conversa.atendente_uuid ? 'Em atendimento' : 'Aguardando atendente'}
                  </span>
                </button>
              ))}
              {!carregando && conversas.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma conversa aguardando atendimento.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="flex min-h-[65dvh] flex-col overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Headphones className="h-5 w-5" />
              {iniciador ? 'Atendimento privado' : 'Conversa selecionada'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Somente você e a equipe autorizada podem acessar esta conversa.
            </p>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-3 sm:p-5">
            <div className="flex-1 space-y-3 overflow-y-auto pb-4">
              {mensagens.map((item) => {
                const minha = item.remetente_uuid === user?.id;
                return (
                  <div key={item.id} className={`flex ${minha ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${
                      minha ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold">
                        {minha ? <User className="h-3 w-3" /> : <Headphones className="h-3 w-3" />}
                        {item.remetente_nome || (minha ? 'Você' : 'Atendimento')}
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm">{item.mensagem}</p>
                      <time className="mt-1 block text-[11px] opacity-70">
                        {new Date(item.criado_em).toLocaleString('pt-BR')}
                      </time>
                    </div>
                  </div>
                );
              })}
              {conversaAtual && mensagens.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Envie a primeira mensagem para iniciar o atendimento.
                </p>
              )}
              {!conversaAtual && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Selecione uma conversa.
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={enviarMensagem} className="flex gap-2 border-t pt-3">
              <Input
                value={novaMensagem}
                onChange={(event) => setNovaMensagem(event.target.value)}
                placeholder="Digite sua mensagem..."
                maxLength={2000}
                disabled={!conversaAtual || enviando}
                className="min-h-12 text-base"
              />
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 shrink-0"
                disabled={!conversaAtual || !novaMensagem.trim() || enviando}
                aria-label="Enviar mensagem"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
