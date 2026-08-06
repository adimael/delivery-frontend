import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Eye, Mail, Phone, Search, ShieldCheck, UserRound, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Cliente {
  id: string;
  nome_completo: string;
  email: string;
  telefone?: string | null;
  ativo: boolean | number | string;
  status_aprovacao?: string;
  email_verificado?: boolean | number | string;
  criado_em?: string;
  atualizado_em?: string;
}

const verdadeiro = (valor: unknown) => !(
  valor === false || valor === 0 || valor === '0'
  || valor === 'false' || valor === 'f' || valor === null
);

const telefoneFormatado = (telefone?: string | null) => {
  const numeros = String(telefone || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (numeros.length === 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  if (numeros.length === 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  return telefone || 'Não informado';
};

const dataFormatada = (valor?: string) => {
  if (!valor) return 'Não informada';
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? 'Não informada' : data.toLocaleString('pt-BR');
};

export default function ManagerCustomers() {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [alterando, setAlterando] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<Cliente | null>(null);
  const [confirmacao, setConfirmacao] = useState<{ cliente: Cliente; ativo: boolean } | null>(null);

  const carregar = async () => {
    setCarregando(true);
    try {
      const resposta = await apiRequest('/perfis?tipo_usuario=cliente');
      setClientes(Array.isArray(resposta) ? resposta : []);
    } catch (error) {
      toast({
        title: 'Não foi possível carregar os clientes',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { void carregar(); }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return clientes;
    return clientes.filter((cliente) => [cliente.nome_completo, cliente.email, cliente.telefone]
      .some((valor) => String(valor || '').toLocaleLowerCase('pt-BR').includes(termo)));
  }, [busca, clientes]);

  const alterarStatus = async (cliente: Cliente, ativo: boolean) => {
    setAlterando(cliente.id);
    try {
      const atualizado = await apiRequest(`/perfis/${cliente.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ tipo_usuario: 'cliente', ativo }),
      }) as Partial<Cliente>;
      setClientes((atuais) => atuais.map((item) => item.id === cliente.id
        ? { ...item, ...atualizado, ativo }
        : item));
      setSelecionado((atual) => atual?.id === cliente.id ? { ...atual, ...atualizado, ativo } : atual);
      setConfirmacao(null);
      toast({
        title: ativo ? 'Cliente ativado' : 'Cliente desativado',
        description: ativo
          ? 'O cliente já pode acessar novamente sua conta.'
          : 'O acesso de cliente foi bloqueado sem afetar outros perfis desta conta.',
      });
    } catch (error) {
      toast({
        title: 'Não foi possível alterar o acesso',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setAlterando(null);
    }
  };

  const ativos = clientes.filter((cliente) => verdadeiro(cliente.ativo)).length;

  return (
    <DashboardLayout title="Clientes" userType="manager">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />Clientes cadastrados</CardTitle></CardHeader><CardContent><strong className="text-3xl">{clientes.length}</strong></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4" />Ativos</CardTitle></CardHeader><CardContent><strong className="text-3xl">{ativos}</strong></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><UserRound className="h-4 w-4" />Desativados</CardTitle></CardHeader><CardContent><strong className="text-3xl">{clientes.length - ativos}</strong></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar clientes</CardTitle>
            <p className="text-sm text-muted-foreground">Consulte os dados cadastrais e controle o acesso de cliente. Senhas são privadas e nunca são exibidas.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Pesquisar por nome, e-mail ou telefone" className="pl-10" />
            </div>

            {carregando ? (
              <div className="flex justify-center py-12"><div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
            ) : filtrados.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado.</p>
            ) : (
              <div className="grid gap-3">
                {filtrados.map((cliente) => {
                  const ativo = verdadeiro(cliente.ativo);
                  return (
                    <article key={cliente.id} className="grid gap-4 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2"><strong className="truncate text-base">{cliente.nome_completo}</strong><Badge variant={ativo ? 'default' : 'secondary'}>{ativo ? 'Ativo' : 'Desativado'}</Badge></div>
                        <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                          <span className="flex min-w-0 items-center gap-2"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{cliente.email}</span></span>
                          <span className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" />{telefoneFormatado(cliente.telefone)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 md:justify-end">
                        <div className="flex items-center gap-2"><Label htmlFor={`cliente-${cliente.id}`} className="text-sm">{ativo ? 'Ativo' : 'Desativado'}</Label><Switch id={`cliente-${cliente.id}`} checked={ativo} disabled={alterando === cliente.id} onCheckedChange={(valor) => setConfirmacao({ cliente, ativo: valor })} /></div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelecionado(cliente)}><Eye className="mr-2 h-4 w-4" />Detalhes</Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={selecionado !== null} onOpenChange={(aberto) => !aberto && setSelecionado(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dados do cliente</DialogTitle><DialogDescription>Informações cadastrais disponíveis para atendimento e gerenciamento do acesso.</DialogDescription></DialogHeader>
          {selecionado && <div className="space-y-4">
            <div className="rounded-2xl bg-muted/60 p-4"><strong className="text-lg">{selecionado.nome_completo}</strong><p className="mt-1 text-sm text-muted-foreground">Cliente {verdadeiro(selecionado.ativo) ? 'ativo' : 'desativado'}</p></div>
            <dl className="grid gap-4 text-sm">
              <div><dt className="text-muted-foreground">Nome completo</dt><dd className="font-medium">{selecionado.nome_completo}</dd></div>
              <div><dt className="text-muted-foreground">E-mail</dt><dd className="break-all font-medium">{selecionado.email}</dd></div>
              <div><dt className="text-muted-foreground">Telefone</dt><dd className="font-medium">{telefoneFormatado(selecionado.telefone)}</dd></div>
              <div><dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" />Cadastro</dt><dd className="font-medium">{dataFormatada(selecionado.criado_em)}</dd></div>
            </dl>
            <div className="flex items-center justify-between rounded-2xl border p-4"><div><strong>Acesso de cliente</strong><p className="text-xs text-muted-foreground">Não altera outros papéis da conta.</p></div><Switch checked={verdadeiro(selecionado.ativo)} disabled={alterando === selecionado.id} onCheckedChange={(valor) => setConfirmacao({ cliente: selecionado, ativo: valor })} /></div>
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Por segurança, senhas não podem ser visualizadas nem alteradas pela gerência.</p>
          </div>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmacao !== null} onOpenChange={(aberto) => !aberto && alterando === null && setConfirmacao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmacao?.ativo ? 'Ativar acesso deste cliente?' : 'Desativar acesso deste cliente?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                Confirme se deseja {confirmacao?.ativo ? 'ativar' : 'desativar'} o acesso de cliente de:
              </span>
              <span className="block rounded-2xl border bg-muted/60 p-4 text-foreground">
                <strong className="block text-base">{confirmacao?.cliente.nome_completo}</strong>
                <span className="mt-1 block break-all text-sm text-muted-foreground">{confirmacao?.cliente.email}</span>
              </span>
              {!confirmacao?.ativo && (
                <span className="block text-sm">
                  O cliente não poderá acessar esta conta até que seja ativado novamente. Outros papéis da mesma conta não serão alterados.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={alterando !== null}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!confirmacao || alterando !== null}
              className={!confirmacao?.ativo ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
              onClick={(event) => {
                event.preventDefault();
                if (confirmacao) void alterarStatus(confirmacao.cliente, confirmacao.ativo);
              }}
            >
              {alterando !== null
                ? 'Salvando...'
                : confirmacao?.ativo ? 'Sim, ativar cliente' : 'Sim, desativar cliente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
