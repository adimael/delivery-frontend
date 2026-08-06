import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RelatorioVenda, useManagerData } from "@/hooks/useManagerData";
import { formatBrazilianPhone } from "@/lib/phone";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Eye,
  FileText,
  Package,
  Receipt,
  Truck,
} from "lucide-react";

const moeda = (valor: unknown) => new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
}).format(Number(valor || 0));

const dataBahiaHoje = (): string => {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valor = (tipo: string) => partes.find(parte => parte.type === tipo)?.value || "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
};

const formatarData = (data: string): string => {
  const [ano, mes, dia] = String(data).slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return data;
  return new Intl.DateTimeFormat("pt-BR").format(new Date(ano, mes - 1, dia));
};

const formatarDataHora = (data?: string): string => {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Bahia",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
};

const rotulo = (valor: string): string => ({
  pendente: "Pendente",
  confirmado: "Confirmado",
  preparando: "Em produção",
  pronto: "Pronto",
  saiu_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
  dinheiro: "Dinheiro",
  pix: "PIX",
  entrega: "Entrega",
  retirada: "Retirada no local",
  nao_informado: "Não informado",
}[valor] || valor.replace(/_/g, " "));

const ManagerReports = () => {
  const { relatorios, loading, gerarRelatorio } = useManagerData();
  const { toast } = useToast();
  const [dataRelatorio, setDataRelatorio] = useState(dataBahiaHoje);
  const [generating, setGenerating] = useState(false);
  const [selecionado, setSelecionado] = useState<RelatorioVenda | null>(null);

  const handleGerarRelatorio = async () => {
    if (!dataRelatorio) {
      toast({ title: "Informe uma data", variant: "destructive" });
      return;
    }
    setGenerating(true);
    const relatorio = await gerarRelatorio(dataRelatorio);
    setGenerating(false);
    if (relatorio) {
      setSelecionado(relatorio);
      toast({
        title: "Relatório gerado",
        description: `Dados de ${formatarData(dataRelatorio)} consultados no banco.`,
      });
      return;
    }
    toast({
      title: "Não foi possível gerar o relatório",
      description: "Confira a data informada e tente novamente.",
      variant: "destructive",
    });
  };

  if (loading) {
    return <DashboardLayout title="Relatórios" userType="manager"><div>Carregando relatórios...</div></DashboardLayout>;
  }

  const totalVendasGeral = relatorios.reduce((sum, rel) => sum + Number(rel.total_vendas), 0);
  const totalPedidosGeral = relatorios.reduce((sum, rel) => sum + Number(rel.total_pedidos), 0);

  return (
    <DashboardLayout title="Relatórios" userType="manager">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><DollarSign className="h-5 w-5" /><div><div className="text-2xl font-bold">{moeda(totalVendasGeral)}</div><p className="text-sm text-muted-foreground">Vendas concluídas nos relatórios</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><FileText className="h-5 w-5" /><div><div className="text-2xl font-bold">{totalPedidosGeral}</div><p className="text-sm text-muted-foreground">Pedidos consultados</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{relatorios.length}</div><p className="text-sm text-muted-foreground">Datas consultadas nesta sessão</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5" />Gerar relatório completo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="data-relatorio">Data do relatório</Label>
                <Input id="data-relatorio" type="date" value={dataRelatorio} max={dataBahiaHoje()} onChange={event => setDataRelatorio(event.target.value)} />
                <p className="mt-2 text-sm text-muted-foreground">O dia é interpretado no fuso de Salvador/Bahia, sem conversão para UTC.</p>
              </div>
              <Button className="min-h-11" onClick={() => void handleGerarRelatorio()} disabled={generating}>
                <Calendar className="mr-2 h-4 w-4" />{generating ? "Consultando banco..." : "Gerar relatório"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Relatórios consultados</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {relatorios.length === 0 ? <p className="py-8 text-center text-muted-foreground">Selecione uma data para gerar o primeiro relatório.</p> : relatorios.map(relatorio => (
              <button key={relatorio.id} type="button" onClick={() => setSelecionado(relatorio)} className="flex w-full flex-col gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                <div><h3 className="font-semibold">Relatório de {formatarData(relatorio.data_relatorio)}</h3><p className="text-sm text-muted-foreground">Gerado em {formatarDataHora(relatorio.criado_em)}</p></div>
                <div className="flex items-center justify-between gap-5 sm:text-right"><div><div className="font-semibold">{moeda(relatorio.total_vendas)}</div><div className="text-sm text-muted-foreground">{relatorio.total_pedidos} pedidos</div></div><Eye className="h-5 w-5" /></div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={selecionado !== null} onOpenChange={aberto => !aberto && setSelecionado(null)}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          {selecionado && <>
            <DialogHeader>
              <DialogTitle>Relatório detalhado — {formatarData(selecionado.data_relatorio)}</DialogTitle>
              <DialogDescription>Dados consolidados diretamente do banco no fuso {selecionado.fuso_horario || "America/Bahia"}.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card><CardContent className="p-4"><Receipt className="mb-2 h-5 w-5" /><strong className="text-xl">{selecionado.total_pedidos}</strong><p className="text-sm text-muted-foreground">Pedidos recebidos</p></CardContent></Card>
              <Card><CardContent className="p-4"><DollarSign className="mb-2 h-5 w-5" /><strong className="text-xl">{moeda(selecionado.total_vendas)}</strong><p className="text-sm text-muted-foreground">Vendas entregues</p></CardContent></Card>
              <Card><CardContent className="p-4"><BarChart3 className="mb-2 h-5 w-5" /><strong className="text-xl">{moeda(selecionado.ticket_medio)}</strong><p className="text-sm text-muted-foreground">Ticket médio entregue</p></CardContent></Card>
              <Card><CardContent className="p-4"><Truck className="mb-2 h-5 w-5" /><strong className="text-xl">{moeda(selecionado.total_taxas_entrega)}</strong><p className="text-sm text-muted-foreground">Taxas de entrega</p></CardContent></Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {[
                ["Status dos pedidos", selecionado.status],
                ["Formas de pagamento", selecionado.formas_pagamento],
                ["Tipos de entrega", selecionado.tipos_entrega],
              ].map(([titulo, dados]) => <Card key={titulo as string}><CardHeader><CardTitle className="text-base">{titulo as string}</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{Object.entries(dados as Record<string, number>).map(([nome, quantidade]) => <Badge key={nome} variant="outline">{rotulo(nome)}: {quantidade}</Badge>)}</CardContent></Card>)}
            </div>

            <Card>
              <CardHeader><CardTitle className="flex items-center text-base"><Package className="mr-2 h-5 w-5" />Produtos vendidos</CardTitle></CardHeader>
              <CardContent>{selecionado.produtos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum produto vendido nessa data.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Produto</th><th className="p-2 text-right">Quantidade</th><th className="p-2 text-right">Valor dos itens</th></tr></thead><tbody>{selecionado.produtos.map(produto => <tr key={produto.nome} className="border-b"><td className="p-2 font-medium">{produto.nome}</td><td className="p-2 text-right">{produto.quantidade}</td><td className="p-2 text-right">{moeda(produto.valor)}</td></tr>)}</tbody></table></div>}</CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Pedidos do dia</h3>
              {selecionado.pedidos.length === 0 ? <p className="rounded-xl border p-5 text-center text-muted-foreground">Nenhum pedido nessa data.</p> : selecionado.pedidos.map(pedido => (
                <Card key={pedido.id || pedido.uuid}>
                  <CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">Pedido #{pedido.numero_pedido}</CardTitle><p className="text-sm text-muted-foreground">{formatarDataHora(pedido.criado_em)} · {pedido.nome_cliente || "Cliente"}{pedido.telefone_cliente ? ` · ${formatBrazilianPhone(pedido.telefone_cliente)}` : ""}</p></div><Badge>{rotulo(pedido.status)}</Badge></div></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2 text-sm sm:grid-cols-2"><p><strong>Entrega:</strong> {rotulo(pedido.tipo_entrega || "nao_informado")}</p><p><strong>Pagamento:</strong> {rotulo(pedido.forma_pagamento || "nao_informado")} ({rotulo(pedido.status_pagamento || "pendente")})</p><p className="sm:col-span-2"><strong>Endereço:</strong> {pedido.endereco_entrega || "Não informado"}</p></div>
                    <div className="rounded-lg bg-muted/35 p-3"><strong className="text-sm">Itens</strong>{(pedido.itens_pedido || []).map((item: any) => <div key={item.id || item.uuid} className="mt-2 border-t pt-2 text-sm"><div className="flex justify-between gap-3"><span>{item.quantidade}x {item.produto_nome || "Produto"}</span><span>{moeda(item.preco_total)}</span></div>{Array.isArray(item.selecoes) && item.selecoes.map((opcao: any, indice: number) => <p key={`${opcao.id || opcao.opcao_uuid || indice}`} className="pl-3 text-xs text-muted-foreground">{opcao.categoria ? `${opcao.categoria}: ` : ""}{opcao.nome || "Opção"}{Number(opcao.quantidade || 1) > 1 ? ` ×${opcao.quantidade}` : ""}{Number(opcao.preco_adicional || 0) > 0 ? ` (+${moeda(opcao.preco_adicional)})` : ""}</p>)}</div>)}</div>
                    <div className="flex flex-wrap justify-end gap-4 text-sm"><span>Desconto: {moeda(pedido.desconto)}</span><span>Taxa: {moeda(pedido.taxa_entrega)}</span><strong>Total: {moeda(pedido.valor_total)}</strong></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManagerReports;
