
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Phone, Package, CheckCircle, FileText, Printer, MessageSquare } from "lucide-react";
import { useMyDeliveries, DeliveryOrder } from "@/hooks/useDeliveryData";
import { apiRequest } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

type CustomOption = { name: string };
type ItemCustomizations = {
  mainOptions?: CustomOption[];
  meatOptions?: CustomOption[];
  extraOptions?: CustomOption[];
  notes?: string;
} | null;

interface InvoiceItem {
  id: string;
  name: string;
  price: number | string;
  quantity: number | string;
  totalPrice: number | string;
  customizations?: ItemCustomizations;
}

interface InvoiceData {
  id?: string;
  numeroOrdem?: string | number;
  nomeDestinatario?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  observacoes?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxaEntrega: number;
  total: number;
  dataHora?: string;
  formaPagamento?: string;
}

const DeliveryMyOrders = () => {
  const { configuracao } = useEstabelecimento();
  const { deliveries, loading, refresh } = useMyDeliveries();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [observacao, setObservacao] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleUpdateStatus = async (deliveryId: string, newStatus: string, obs?: string) => {
    setUpdatingOrder(deliveryId);
    
    try {
      type UpdateStatusPayload = { status: string; observacoes_entrega?: string };
      const updateData: UpdateStatusPayload = { 
        status: newStatus
      };

      if (obs && obs.trim()) {
        updateData.observacoes_entrega = obs.trim();
      }

      const data = await apiRequest(`/pedidos/${deliveryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      toast({
        title: "Status atualizado",
        description: `Entrega marcada como ${getStatusLabel(newStatus)}.`,
      });

      // Refresh deliveries so UI reflects new status immediately
      try { await refresh(); } catch (e) { console.warn('Falha ao atualizar lista de entregas após mudança de status', e); }

      setObservacao("");
      setSelectedStatus("");
      setDialogOpen(false);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da entrega.",
        variant: "destructive",
      });
      return false;
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'saiu_entrega':
        return <Badge className="bg-blue-100 text-blue-800">Em rota</Badge>;
      case 'entregue':
        return <Badge className="bg-green-100 text-green-800">Entregue</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'saiu_entrega': return 'Em rota';
      case 'entregue': return 'Entregue';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const handlePrintInvoice = async (delivery: DeliveryOrder) => {
    // Request the validated invoice from the same endpoint the client uses so formats match
    try {
      const resp = await apiRequest(`/pedidos/validar/${delivery.id}`);
      if (!resp || !resp.valid || !resp.invoice) {
        // fallback to previous simple print if validation not available
        console.warn('Invoice validation endpoint did not return a formatted invoice, using fallback.');
      } else {
  const pedido = resp.invoice as Record<string, unknown>;
        // Reuse the same formatting logic as InvoiceValidation
  const enderecoCompleto = String(pedido.endereco_entrega || '').split(', ');

        let telefoneCliente = '';
        if ((pedido.tipo_cliente as string) === 'convidado') {
          try {
            const primeiros = (pedido.itens_pedido as Array<Record<string, unknown>> | undefined) || [];
            const primeiroItem = primeiros[0];
            const obs = primeiroItem?.observacoes as string | undefined;
            if (obs) {
              const parsed = JSON.parse(obs) as Record<string, unknown>;
              telefoneCliente = String(parsed?.telefone_cliente ?? '');
            }
          } catch (e) { console.warn('Erro ao parsear observações do item:', e); }
        }

        const rawItems = (pedido.itens_pedido as Array<Record<string, unknown>> | undefined) || [];
        const items: InvoiceItem[] = rawItems.map((item) => {
          let customizations: ItemCustomizations = null;
          let name = (item.produto_nome as string) || 'Produto';
          try {
            const obs = item.observacoes as string | undefined;
            if (obs) {
              const parsed = JSON.parse(obs);
              name = (parsed && (parsed as Record<string, unknown>).nome as string) || name;
              customizations = (parsed && (parsed as Record<string, unknown>).customizations) as ItemCustomizations;
            }
          } catch (e) { console.warn('Erro ao parsear observacoes do item:', e); }
          return {
            id: String(item.id || ''),
            name,
            price: Number(item.preco_unitario as unknown) || 0,
            quantity: Number(item.quantidade as unknown) || 0,
            totalPrice: Number(item.preco_total as unknown) || 0,
            customizations
          };
        });
        const subtotal = items.reduce((acc: number, it: InvoiceItem) => acc + (Number(it.totalPrice) || 0), 0);
        const taxaEntrega = Number(pedido.taxa_entrega) || 0;
        const total = Number((subtotal + taxaEntrega).toFixed(2));
        const isLocalPickup = String(pedido.endereco_entrega || '').toLowerCase().includes('retirada') || String(pedido.endereco_entrega || '').toLowerCase().includes('balcão') || String(pedido.endereco_entrega || '').toLowerCase().includes('local');

        const enderecoEstabelecimento = configuracao?.endereco_estabelecimento || '';
        const cidadeEstabelecimento = configuracao?.cidade_estabelecimento || '';
        const estadoEstabelecimento = configuracao?.estado_estabelecimento || '';
        const enderecoLoja = `${enderecoEstabelecimento}\n${cidadeEstabelecimento}, ${estadoEstabelecimento}`;

        const invoiceData = {
          id: pedido.id,
          numeroOrdem: pedido.numero_pedido,
          nomeDestinatario: pedido.nome_cliente,
          telefone: telefoneCliente,
          endereco: isLocalPickup ? enderecoLoja : (enderecoCompleto[0] || pedido.endereco_entrega),
          numero: enderecoCompleto[1] || '',
          complemento: enderecoCompleto[2] || '',
          bairro: enderecoCompleto[3] || '',
          cidade: enderecoCompleto[4] || '',
          cep: enderecoCompleto[5] || '',
          observacoes: pedido.observacoes,
          items,
          subtotal,
          taxaEntrega,
          total,
          dataHora: pedido.criado_em,
          formaPagamento: 'pix'
  } as InvoiceData;

        // Build a simplified, client-identical invoice HTML to ensure parity with customer print
        const head = `
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <style>body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:20px}h1{font-size:20px;margin:0}p{margin:4px 0}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}th{background:#f7f7f7;font-weight:600} .right{text-align:right}</style>
        `;

        const shopName = configuracao?.nome_plataforma || 'Meu Delivery';
        const shopDesc = configuracao?.descricao_plataforma || '';
        const shopCnpj = String(pedido.cnpj || '00.000.000/0000-00');

        const linesAddress = String(invoiceData.endereco || '').split('\n').filter(Boolean);
        const enderecoLinha = linesAddress[0] || '';
        const numeroLinha = invoiceData.numero ? `, ${invoiceData.numero}` : '';
        const cidadeLinha = invoiceData.cidade || '';
        const cepLinha = invoiceData.cep ? `CEP: ${invoiceData.cep}` : '';

        const itemsRows = invoiceData.items.map(it => `
          <tr>
            <td>${it.name}</td>
            <td class="right">${it.quantity}</td>
            <td class="right">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(it.price)||0)}</td>
            <td class="right">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(it.totalPrice)|| (Number(it.price||0)*Number(it.quantity||0)))}</td>
          </tr>
        `).join('');

        const invoiceHtml = `<!doctype html><html><head>${head}</head><body>
          <h1>Nota Fiscal</h1>
          <h2 style="margin-top:8px">${shopName}</h2>
          <p>${shopDesc}</p>
          <p><strong>CNPJ:</strong> ${shopCnpj}</p>

          <h3 style="margin-top:12px">Dados do Pedido</h3>
          <p><strong>Número:</strong> #${invoiceData.numeroOrdem}</p>
          <p><strong>Data/Hora:</strong> ${new Date(invoiceData.dataHora || Date.now()).toLocaleString('pt-BR')}</p>
          <p><strong>Pagamento:</strong> ${String(invoiceData.formaPagamento || 'PIX').toUpperCase()}</p>

          <h3 style="margin-top:12px">Endereço de Entrega</h3>
          ${invoiceData.nomeDestinatario ? `<p><strong>Destinatário:</strong> ${invoiceData.nomeDestinatario}</p>` : ''}
          <p>${enderecoLinha}${numeroLinha}${invoiceData.complemento ? `, ${invoiceData.complemento}` : ''}</p>
          <p>${cidadeLinha}${invoiceData.cep ? `, ${cepLinha}` : ''}</p>

          <h3 style="margin-top:12px">Itens do Pedido</h3>
          <table>
            <thead><tr><th>Item</th><th class="right">Qtd</th><th class="right">Preço Unit.</th><th class="right">Total</th></tr></thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="margin-top:12px;">
            <div style="display:flex;justify-content:space-between"><div>Subtotal:</div><div>${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(invoiceData.subtotal)}</div></div>
            <div style="display:flex;justify-content:space-between"><div>Taxa de Entrega:</div><div>${invoiceData.taxaEntrega === 0 ? 'Grátis' : new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(invoiceData.taxaEntrega)}</div></div>
            <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:8px"><div>Total:</div><div>${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(invoiceData.total)}</div></div>
          </div>

          <p style="margin-top:18px">Obrigado pela preferência!</p>
          <p>Este documento serve como comprovante de pedido.</p>
        </body></html>`;

        // Inject into iframe and print (reuse same iframe printing helper used elsewhere)
        const iframeId = `invoice-print-iframe-${delivery.id}`;
        const existing = document.getElementById(iframeId);
        if (existing) existing.remove();
        const iframe = document.createElement('iframe');
        iframe.id = iframeId;
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.top = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (!doc) { iframe.remove(); return; }
        doc.open();
        doc.write(invoiceHtml);
        doc.close();
        const doPrint = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.warn('Erro ao imprimir iframe, chamando window.print()', e);
            try { window.print(); } catch (err) { console.warn('window.print falhou', err); }
          } finally {
            setTimeout(() => {
              try { iframe.remove(); } catch (e) { console.warn('Erro ao remover iframe de impressão', e); }
            }, 500);
          }
        };
        setTimeout(doPrint, 300);
        return;
      }
    } catch (e) {
      console.error('Erro ao obter invoice validado:', e);
    }

    // fallback: build the same simplified invoice using delivery data
    const head = `
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:20px}h1{font-size:20px;margin:0}p{margin:4px 0}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}th{background:#f7f7f7;font-weight:600} .right{text-align:right}</style>
    `;

    const shopName = configuracao?.nome_plataforma || 'Meu Delivery';
    const shopDesc = configuracao?.descricao_plataforma || '';
    const shopCnpj = String(configuracao?.cnpj || '00.000.000/0000-00');

  const enderecoLines = String(delivery.endereco_entrega || '').split(',').map(s => s.trim());
  const enderecoLinha = enderecoLines[0] || '';
  const numeroLinha = enderecoLines[1] ? `, ${enderecoLines[1]}` : '';
  const cidade = enderecoLines.length >= 3 ? enderecoLines[enderecoLines.length - 2] || '' : (enderecoLines[1] || '');
  const cepMatch = String(delivery.endereco_entrega || '').match(/\d{8}/);
  const cep = cepMatch ? cepMatch[0] : '';

    const itemsRows = (delivery.itens_pedido || []).map((item) => `
      <tr>
        <td>${item.produto_nome}</td>
        <td class="right">${item.quantidade}</td>
        <td class="right">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(item.preco_unitario)||0)}</td>
        <td class="right">${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(item.preco_total)||0)}</td>
      </tr>
    `).join('');

    const subtotal = (delivery.itens_pedido || []).reduce((acc: number, it: { preco_total?: number | string }) => acc + (Number(it.preco_total) || 0), 0);
    const taxaEntrega = Number(delivery.taxa_entrega) || 0;
    const total = Number(delivery.valor_total) || subtotal + taxaEntrega;

    const invoiceHtml = `<!doctype html><html><head>${head}</head><body>
      <h1>Nota Fiscal</h1>
      <h2 style="margin-top:8px">${shopName}</h2>
      <p>${shopDesc}</p>
      <p><strong>CNPJ:</strong> ${shopCnpj}</p>

      <h3 style="margin-top:12px">Dados do Pedido</h3>
      <p><strong>Número:</strong> #${delivery.numero_pedido}</p>
      <p><strong>Data/Hora:</strong> ${new Date(delivery.criado_em).toLocaleString('pt-BR')}</p>
  <p><strong>Pagamento:</strong> PIX</p>

      <h3 style="margin-top:12px">Endereço de Entrega</h3>
      ${delivery.nome_cliente ? `<p><strong>Destinatário:</strong> ${delivery.nome_cliente}</p>` : ''}
      <p>${enderecoLinha}${numeroLinha}</p>
      <p>${cidade}${cep ? `, CEP: ${String(cep).replace(/\D/g,'')}` : ''}</p>

      <h3 style="margin-top:12px">Itens do Pedido</h3>
      <table>
        <thead><tr><th>Item</th><th class="right">Qtd</th><th class="right">Preço Unit.</th><th class="right">Total</th></tr></thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="margin-top:12px;">
        <div style="display:flex;justify-content:space-between"><div>Subtotal:</div><div>${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(subtotal)}</div></div>
        <div style="display:flex;justify-content:space-between"><div>Taxa de Entrega:</div><div>${taxaEntrega === 0 ? 'Grátis' : new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(taxaEntrega)}</div></div>
        <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:8px"><div>Total:</div><div>${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(total)}</div></div>
      </div>

      <p style="margin-top:18px">Obrigado pela preferência!</p>
      <p>Este documento serve como comprovante de pedido.</p>
    </body></html>`;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0'; iframe.id = `print-iframe-${delivery.id}`;
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document; if (!doc) { document.body.removeChild(iframe); return; }
    doc.open(); doc.write(invoiceHtml); doc.close();
    const onLoad = () => {
      try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }
      catch (e) { console.warn('Erro ao imprimir via onload do iframe', e); }
      finally {
        setTimeout(() => { try { document.body.removeChild(iframe); } catch (e) { console.warn('Erro ao remover iframe (onload)', e); } }, 500);
      }
    };
  iframe.onload = onLoad;
  };

  if (loading) {
    return (
      <DashboardLayout title="Minhas Entregas" userType="delivery">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kumekume-orange"></div>
        </div>
      </DashboardLayout>
    );
  }

  // sort deliveries: 'saiu_entrega' (Em rota) first, 'entregue' last, others in between
  const sortedDeliveries = [...deliveries].sort((a, b) => {
    const rank = (d: typeof a) => {
      if (d.status === 'saiu_entrega') return 0;
      if (d.status === 'entregue') return 2;
      return 1;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    // fallback: keep original order by created date (newest first)
    try {
      const ta = new Date(a.criado_em).getTime() || 0;
      const tb = new Date(b.criado_em).getTime() || 0;
      return tb - ta;
    } catch (e) {
      return 0;
    }
  });

  return (
    <DashboardLayout title="Minhas Entregas" userType="delivery">
      <div className="space-y-4">
        {sortedDeliveries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma entrega em andamento
              </h3>
              <p className="text-gray-500">
                Você não possui entregas em andamento no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedDeliveries.map((delivery) => (
            <Card key={delivery.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Pedido #{delivery.numero_pedido}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(delivery.status)}
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDistanceToNow(new Date(delivery.criado_em), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {delivery.valor_total.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Taxa: R$ {delivery.taxa_entrega.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Informações do Cliente */}
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <span className="font-medium">Nome:</span>
                      <span className="ml-2">{delivery.nome_cliente || delivery.perfis?.nome_completo || 'Cliente'}</span>
                    </div>
                    {delivery.perfis?.telefone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        <span>{delivery.perfis.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Endereço de Entrega */}
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Endereço de Entrega
                  </h4>
                  <p className="text-sm text-gray-700">{delivery.endereco_entrega}</p>
                </div>

                {/* Itens do Pedido */}
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {delivery.itens_pedido.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">{item.quantidade}x</span>
                          <span className="ml-2">{item.produto_nome}</span>
                        </div>
                        <span className="font-medium">R$ {Number(item.preco_total).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observações do Pedido */}
                {delivery.observacoes && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">Observações do Pedido</h4>
                    <p className="text-sm text-gray-700">{delivery.observacoes}</p>
                  </div>
                )}

                {/* Observações da Entrega */}
                {delivery.observacoes_entrega && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">Observações da Entrega</h4>
                    <p className="text-sm text-gray-700">{delivery.observacoes_entrega}</p>
                  </div>
                )}

                {/* Ações */}
                <div className="pt-2 space-y-2">
                  {/* Botão Imprimir Nota Fiscal */}
                  <Button 
                    onClick={() => handlePrintInvoice(delivery)}
                    variant="outline"
                    className="w-full"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir Nota Fiscal
                  </Button>

                  {/* Atualizar Status - apenas para entregas em andamento */}
                  {delivery.status === 'saiu_entrega' && (
                    <div className="grid gap-2">
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Atualizar Status da Entrega
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Atualizar Status da Entrega</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <label className="text-sm font-medium">Novo Status:</label>
                              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="entregue">Entregue</SelectItem>
                                  <SelectItem value="cancelado">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Observações da Entrega:</label>
                              <Textarea
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                placeholder="Digite observações sobre a entrega (opcional)"
                                className="mt-1"
                              />
                            </div>
                            
                            <Button 
                              onClick={() => handleUpdateStatus(delivery.id, selectedStatus, observacao)}
                              disabled={!selectedStatus || updatingOrder === delivery.id}
                              className="w-full"
                            >
                              {updatingOrder === delivery.id ? "Atualizando..." : "Atualizar Status"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {/* Status final */}
                  {delivery.status === 'entregue' && delivery.entregue_em && (
                    <div className="pt-2 text-center text-sm text-gray-500">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      Entregue {formatDistanceToNow(new Date(delivery.entregue_em), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </div>
                  )}

                  {delivery.status === 'cancelado' && (
                    <div className="pt-2 text-center text-sm text-red-500">
                      Entrega cancelada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeliveryMyOrders;
