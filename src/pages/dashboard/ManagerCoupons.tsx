import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Edit3, PackageCheck, Percent, Save, ShieldCheck, Ticket, Trash2, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

type Produto = { uuid: string; nome: string; ativo?: boolean | number };
type Cupom = {
  uuid: string; codigo: string; descricao?: string; tipo: "percentual" | "fixo";
  valor: number; desconto_maximo?: number | null; pedido_minimo: number;
  limite_usos?: number | null; usos_realizados: number; limite_por_cliente: number;
  valido_de?: string | null; valido_ate?: string | null; ativo: boolean | number;
  exige_cadastro?: boolean | number; somente_primeiro_pedido?: boolean | number;
  escopo?: "pedido" | "produtos"; produtos?: Array<{ produto_uuid: string; nome: string }>;
};

const vazio = {
  codigo: "", descricao: "", tipo: "percentual" as "percentual" | "fixo",
  valor: 10, desconto_maximo: "", pedido_minimo: 0, limite_usos: "",
  limite_por_cliente: 1, valido_de: "", valido_ate: "", ativo: true,
  exige_cadastro: true, somente_primeiro_pedido: false,
  escopo: "pedido" as "pedido" | "produtos", produtos_uuid: [] as string[],
};

const dataLocal = (value?: string | null) => value ? value.slice(0, 16) : "";
const moeda = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function ManagerCoupons() {
  const { toast } = useToast();
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState("");

  const carregar = async () => {
    const [listaCupons, listaProdutos] = await Promise.all([
      apiRequest("/admin/cupons"),
      apiRequest("/admin/produtos"),
    ]);
    setCupons(Array.isArray(listaCupons) ? listaCupons : []);
    setProdutos((Array.isArray(listaProdutos) ? listaProdutos : []).filter((p) => Number(p.ativo ?? 1) === 1));
  };

  useEffect(() => { void carregar(); }, []);

  const produtosVisiveis = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();
    return produtos.filter((produto) => !termo || produto.nome.toLowerCase().includes(termo));
  }, [produtos, buscaProduto]);

  const selecionarProduto = (uuid: string, marcado: boolean) => {
    setForm((atual) => ({
      ...atual,
      produtos_uuid: marcado
        ? [...new Set([...atual.produtos_uuid, uuid])]
        : atual.produtos_uuid.filter((id) => id !== uuid),
    }));
  };

  const editar = (cupom: Cupom) => {
    setEditando(cupom.uuid);
    setForm({
      codigo: cupom.codigo,
      descricao: cupom.descricao || "",
      tipo: cupom.tipo,
      valor: Number(cupom.valor),
      desconto_maximo: cupom.desconto_maximo ? String(cupom.desconto_maximo) : "",
      pedido_minimo: Number(cupom.pedido_minimo || 0),
      limite_usos: cupom.limite_usos ? String(cupom.limite_usos) : "",
      limite_por_cliente: Number(cupom.limite_por_cliente || 1),
      valido_de: dataLocal(cupom.valido_de),
      valido_ate: dataLocal(cupom.valido_ate),
      ativo: Number(cupom.ativo) === 1,
      exige_cadastro: Number(cupom.exige_cadastro ?? 1) === 1,
      somente_primeiro_pedido: Number(cupom.somente_primeiro_pedido ?? 0) === 1,
      escopo: cupom.escopo || "pedido",
      produtos_uuid: (cupom.produtos || []).map((produto) => produto.produto_uuid),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const salvar = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.exige_cadastro && !form.limite_usos) {
      toast({ title: "Defina um limite total", description: "Cupons para visitantes precisam de uma limitação global.", variant: "destructive" });
      return;
    }
    setSalvando(true);
    try {
      await apiRequest(editando ? `/admin/cupons/${editando}` : "/admin/cupons", {
        method: editando ? "PATCH" : "POST",
        body: JSON.stringify({
          ...form,
          desconto_maximo: form.desconto_maximo ? Number(form.desconto_maximo) : null,
          limite_usos: form.limite_usos ? Number(form.limite_usos) : null,
          produtos_uuid: form.escopo === "produtos" ? form.produtos_uuid : [],
        }),
      });
      toast({ title: editando ? "Cupom atualizado" : "Cupom criado", description: "As regras já serão conferidas no fechamento do pedido." });
      setForm(vazio); setEditando(null); await carregar();
    } catch (error) {
      toast({ title: "Não foi possível salvar", description: error instanceof Error ? error.message : "Confira as regras.", variant: "destructive" });
    } finally { setSalvando(false); }
  };

  const desativar = async (uuid: string) => {
    await apiRequest(`/admin/cupons/${uuid}`, { method: "DELETE" });
    await carregar();
  };

  return (
    <DashboardLayout title="Cupons e promoções" userType="manager">
      <div className="coupon-manager">
        <Card className="coupon-editor">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Ticket /> {editando ? "Editar campanha" : "Nova campanha promocional"}</CardTitle>
            <p className="text-sm text-muted-foreground">Combine regras de público, produtos, período e limites de utilização.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={salvar} className="space-y-6">
              <section className="coupon-section">
                <header><strong>Identificação</strong><small>Como a promoção será reconhecida.</small></header>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><Label htmlFor="codigo">Código do cupom</Label><Input id="codigo" value={form.codigo} maxLength={40} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} placeholder="PRIMEIRACOMPRA" required /></div>
                  <div><Label>Status</Label><Select value={form.ativo ? "ativo" : "inativo"} onValueChange={(v) => setForm({ ...form, ativo: v === "ativo" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent></Select></div>
                </div>
                <div><Label htmlFor="descricao">Descrição interna</Label><Textarea id="descricao" value={form.descricao} maxLength={180} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Objetivo e condições da campanha" /></div>
              </section>

              <section className="coupon-section">
                <header><strong>Benefício</strong><small>Defina como o desconto será calculado.</small></header>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div><Label>Tipo</Label><Select value={form.tipo} onValueChange={(tipo: "percentual" | "fixo") => setForm({ ...form, tipo })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentual">Porcentagem</SelectItem><SelectItem value="fixo">Valor fixo</SelectItem></SelectContent></Select></div>
                  <div><Label htmlFor="valor">Desconto ({form.tipo === "percentual" ? "%" : "R$"})</Label><Input id="valor" type="number" min=".01" max={form.tipo === "percentual" ? 100 : undefined} step=".01" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} required /></div>
                  <div><Label htmlFor="teto">Teto do desconto (R$)</Label><Input id="teto" type="number" min=".01" step=".01" value={form.desconto_maximo} onChange={(e) => setForm({ ...form, desconto_maximo: e.target.value })} placeholder="Sem teto" /></div>
                </div>
                <div><Label htmlFor="minimo">Valor mínimo do pedido (R$)</Label><Input id="minimo" type="number" min="0" step=".01" value={form.pedido_minimo} onChange={(e) => setForm({ ...form, pedido_minimo: Number(e.target.value) })} /></div>
              </section>

              <section className="coupon-section">
                <header><strong>Produtos participantes</strong><small>Aplique no pedido inteiro ou somente em itens selecionados.</small></header>
                <Select value={form.escopo} onValueChange={(escopo: "pedido" | "produtos") => setForm({ ...form, escopo })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pedido">Todos os produtos do pedido</SelectItem><SelectItem value="produtos">Somente produtos selecionados</SelectItem></SelectContent></Select>
                {form.escopo === "produtos" && <div className="coupon-products"><Input value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)} placeholder="Pesquisar produto..." /><div>{produtosVisiveis.map((produto) => <label key={produto.uuid}><Checkbox checked={form.produtos_uuid.includes(produto.uuid)} onCheckedChange={(v) => selecionarProduto(produto.uuid, v === true)} /><span>{produto.nome}</span></label>)}</div><small>{form.produtos_uuid.length} produto(s) selecionado(s)</small></div>}
              </section>

              <section className="coupon-section">
                <header><strong>Público e elegibilidade</strong><small>Evite abuso definindo quem pode usar.</small></header>
                <label className="coupon-rule"><Checkbox checked={form.exige_cadastro} onCheckedChange={(v) => setForm({ ...form, exige_cadastro: v === true, somente_primeiro_pedido: v === true ? form.somente_primeiro_pedido : false })} /><span><strong>Exigir cliente cadastrado</strong><small>Permite controlar o histórico e o limite por pessoa.</small></span></label>
                <label className="coupon-rule"><Checkbox disabled={!form.exige_cadastro} checked={form.somente_primeiro_pedido} onCheckedChange={(v) => setForm({ ...form, somente_primeiro_pedido: v === true })} /><span><strong>Somente no primeiro pedido</strong><small>O cliente não pode possuir pedidos anteriores.</small></span></label>
              </section>

              <section className="coupon-section">
                <header><strong>Limites e validade</strong><small>Toda promoção deve ter controles mensuráveis.</small></header>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label htmlFor="total">Limite total de usos</Label><Input id="total" type="number" min="1" value={form.limite_usos} onChange={(e) => setForm({ ...form, limite_usos: e.target.value })} placeholder={form.exige_cadastro ? "Opcional" : "Obrigatório"} /></div>
                  <div><Label htmlFor="cliente">Limite por cliente</Label><Input id="cliente" type="number" min="1" value={form.limite_por_cliente} disabled={!form.exige_cadastro} onChange={(e) => setForm({ ...form, limite_por_cliente: Number(e.target.value) })} /></div>
                  <div><Label htmlFor="inicio">Início da validade</Label><Input id="inicio" type="datetime-local" value={form.valido_de} onChange={(e) => setForm({ ...form, valido_de: e.target.value })} /></div>
                  <div><Label htmlFor="fim">Fim da validade</Label><Input id="fim" type="datetime-local" value={form.valido_ate} onChange={(e) => setForm({ ...form, valido_ate: e.target.value })} /></div>
                </div>
              </section>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {editando && <Button type="button" variant="outline" onClick={() => { setEditando(null); setForm(vazio); }}>Cancelar edição</Button>}
                <Button type="submit" disabled={salvando}><Save /> {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar cupom"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="coupon-list">
          <header><div><h2>Campanhas configuradas</h2><p>{cupons.length} cupom(ns) criado(s)</p></div></header>
          <div className="grid gap-4 xl:grid-cols-2">
            {cupons.map((cupom) => <Card key={cupom.uuid} className="coupon-card"><CardContent>
              <div className="coupon-card-head"><div><strong>{cupom.codigo}</strong><p>{cupom.descricao || "Sem descrição"}</p></div><Badge variant={Number(cupom.ativo) === 1 ? "default" : "secondary"}>{Number(cupom.ativo) === 1 ? "Ativo" : "Inativo"}</Badge></div>
              <div className="coupon-value">{cupom.tipo === "percentual" ? <><Percent />{Number(cupom.valor)}%</> : moeda(Number(cupom.valor))}</div>
              <div className="coupon-tags">
                <span><Users />{Number(cupom.exige_cadastro ?? 1) === 1 ? "Clientes cadastrados" : "Visitantes permitidos"}</span>
                {Number(cupom.somente_primeiro_pedido ?? 0) === 1 && <span><ShieldCheck />Primeiro pedido</span>}
                <span><PackageCheck />{cupom.escopo === "produtos" ? `${cupom.produtos?.length || 0} produtos` : "Pedido inteiro"}</span>
                {(cupom.valido_de || cupom.valido_ate) && <span><CalendarDays />Período definido</span>}
              </div>
              <p className="coupon-usage">{cupom.usos_realizados} uso(s){cupom.limite_usos ? ` de ${cupom.limite_usos}` : ""} · até {cupom.limite_por_cliente} por cliente</p>
              <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => editar(cupom)}><Edit3 /> Editar</Button><Button variant="outline" disabled={Number(cupom.ativo) !== 1} onClick={() => void desativar(cupom.uuid)}><Trash2 /> Desativar</Button></div>
            </CardContent></Card>)}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
