import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, AlertCircle, Printer } from "lucide-react";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { apiRequest } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const InvoiceValidation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { configuracao } = useEstabelecimento();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // Use the platform name from configuration or default to "Plataforma"
  const platformName = configuracao?.nome_plataforma || "Plataforma";

  useEffect(() => {
    const validateInvoice = async () => {
      try {
        if (!orderId) {
          setIsValid(false);
          setError("ID do pedido não fornecido");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        
        // Call the backend to validate the invoice
        const response = await apiRequest(`/pedidos/validar/${orderId}`);
        
        if (response.valid) {
          setIsValid(true);
          
          // Transform the data to match the format used in StaffOrders
          const pedido = response.invoice;
          const enderecoCompleto = pedido.endereco_entrega.split(', ');
          
          let telefoneCliente = '';
          if (pedido.tipo_cliente === 'convidado') {
            try {
              const primeiroItem = pedido.itens_pedido[0];
              if (primeiroItem?.observacoes) {
                const parsed = JSON.parse(primeiroItem.observacoes);
                telefoneCliente = parsed.telefone_cliente || '';
              }
            } catch (e) {
              // Se não conseguir extrair o telefone, deixa vazio
            }
          }
          
          const items = pedido.itens_pedido.map((item: any) => {
            let customizations = null;
            let name = item.produto_nome || 'Produto';
            try {
              if (item.observacoes) {
                const parsed = JSON.parse(item.observacoes);
                name = parsed.nome || name;
                customizations = parsed.customizations;
              }
            } catch (e) {
              // Se não conseguir fazer parse, usa valores padrão
            }
            return {
              id: item.id,
              name: name,
              price: item.preco_unitario,
              quantity: item.quantidade,
              totalPrice: item.preco_total,
              customizations: customizations
            };
          });
          const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.totalPrice) || 0), 0);
          const taxaEntrega = Number(pedido.taxa_entrega) || 0;
          const total = Number((subtotal + taxaEntrega).toFixed(2));
          const isLocalPickup = isRetiradaLocal(pedido.endereco_entrega);
          
          // Use configurable establishment address
          const enderecoEstabelecimento = configuracao?.endereco_estabelecimento;
          const cidadeEstabelecimento = configuracao?.cidade_estabelecimento;
          const estadoEstabelecimento = configuracao?.estado_estabelecimento;
          const cepEstabelecimento = configuracao?.cep_estabelecimento;
          const enderecoLoja = `${enderecoEstabelecimento}\n${cidadeEstabelecimento}, ${estadoEstabelecimento}`;
          
          const formattedInvoiceData = {
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
          };
          
          setInvoiceData(formattedInvoiceData);
        } else {
          setIsValid(false);
          setError(response.message || "Nota fiscal inválida");
        }
      } catch (err: any) {
        console.error("Erro ao validar nota fiscal:", err);
        setIsValid(false);
        setError(err.message || "Erro ao validar nota fiscal");
      } finally {
        setLoading(false);
      }
    };

    validateInvoice();
  }, [orderId, configuracao]);

  // Função para verificar se é um pedido para retirada no local
  const isRetiradaLocal = (endereco: string) => {
    return endereco.toLowerCase().includes('retirada') || 
           endereco.toLowerCase().includes('balcão') || 
           endereco.toLowerCase().includes('local');
  };

  const handleBack = () => {
    navigate("/");
  };

  const handlePrint = () => {
    // Print by creating a hidden iframe with the invoice HTML so we don't open a new tab
    const invoiceEl = document.getElementById('invoice-printable');
    if (!invoiceEl) {
      setTimeout(() => window.print(), 200);
      return;
    }

    const iframeId = 'invoice-print-iframe';
    const existing = document.getElementById(iframeId);
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    // Keep it out of view but present in DOM so print can access it
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.top = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      setTimeout(() => window.print(), 200);
      return;
    }

    const head = document.head.innerHTML;
    doc.open();
    doc.write(`<!doctype html><html><head>${head}<style>html,body{background:#fff}</style></head><body>${invoiceEl.innerHTML}</body></html>`);
    doc.close();

    const doPrint = () => {
      try {
        iframe.contentWindow?.focus();
        // Print iframe content
        iframe.contentWindow?.print();
      } catch (e) {
        // fallback
        window.print();
      } finally {
        setTimeout(() => {
          try { iframe.remove(); } catch (e) { /* ignore removal errors */ }
        }, 500);
      }
    };

    // Wait a bit for styles/resources inside iframe to load
    setTimeout(doPrint, 300);
  };

  const handleCloseInvoice = () => {
    setShowInvoice(false);
  };

  // Generate QR code URL for invoice validation
  const generateValidationQRCode = () => {
    // In a real implementation, this would point to your validation endpoint
    // For now, we'll use a placeholder that would work in a real deployment
    if (!invoiceData) return '';
    const validationUrl = `${window.location.origin}/validate-invoice/${invoiceData.numeroOrdem}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(validationUrl)}`;
  };

  const renderInvoice = () => {
    if (!invoiceData) return null;
    // Concatena todas as partes do endereço para checar se já existe a palavra 'cep'
    const fullAddressForCEPCheck = `${invoiceData.endereco || ''} ${invoiceData.numero || ''} ${invoiceData.complemento || ''} ${invoiceData.bairro || ''} ${invoiceData.cidade || ''} ${invoiceData.cep || ''}`.toLowerCase();

    return (
      <Dialog open={true} onOpenChange={handleCloseInvoice}>
        <DialogContent id="invoice-printable" className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full">
          <DialogHeader className="print:hidden">
            <DialogTitle className="text-xl font-bold">Nota Fiscal</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 print:space-y-4">
            {/* Cabeçalho da empresa */}
            <div className="text-center border-b pb-4 print:pb-2">
              <h1 className="text-2xl font-bold text-kumekume-orange print:text-black">{platformName}</h1>
              <p className="text-sm text-gray-600">{configuracao?.descricao_plataforma}</p>
              {configuracao?.cnpj && (
                <p className="text-xs text-gray-500">CNPJ: {configuracao.cnpj}</p>
              )}
            </div>

            {/* Informações do pedido */}
            <div className="grid grid-cols-2 gap-4 print:gap-2">
              <div>
                <h3 className="font-semibold mb-2">Dados do Pedido</h3>
                <p className="text-sm"><strong>Número:</strong> #{invoiceData.numeroOrdem}</p>
                <p className="text-sm"><strong>Data/Hora:</strong> {new Date(invoiceData.dataHora).toLocaleString('pt-BR')}</p>
                <p className="text-sm"><strong>Pagamento:</strong> {invoiceData.formaPagamento.toUpperCase()}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Endereço de Entrega</h3>
                {invoiceData.nomeDestinatario && (
                  <p className="text-sm"><strong>Destinatário:</strong> {invoiceData.nomeDestinatario}</p>
                )}
                {invoiceData.telefone && (
                  <p className="text-sm"><strong>Telefone:</strong> {invoiceData.telefone}</p>
                )}
                {(!invoiceData.endereco || invoiceData.endereco.toLowerCase().includes('retirada')) ? (
                  <>
                    <p className="text-sm">{configuracao?.endereco_estabelecimento}</p>
                    <p className="text-sm">
                      {configuracao?.cidade_estabelecimento}, {configuracao?.estado_estabelecimento}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm">
                      {invoiceData.endereco}
                      {invoiceData.numero && !invoiceData.endereco.trim().endsWith(',') ? `, ${invoiceData.numero}` : ` ${invoiceData.numero || ''}`}
                      {invoiceData.complemento ? `, ${invoiceData.complemento}` : ''}
                    </p>
                    <p className="text-sm">{invoiceData.bairro} {invoiceData.cidade}{!fullAddressForCEPCheck.includes('cep') ? ` CEP: ${configuracao?.cep_estabelecimento}` : ''}</p>
                  </>
                )}
                {invoiceData.observacoes && (
                  <p className="text-sm"><strong>Obs:</strong> {invoiceData.observacoes}</p>
                )}
              </div>
            </div>

            {/* Itens do pedido */}
            <div>
              <h3 className="font-semibold mb-3">Itens do Pedido</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 bg-gray-50 p-3 text-sm font-medium print:bg-gray-100">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-2 text-center">Qtd</div>
                  <div className="col-span-2 text-right">Preço Unit.</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                {invoiceData.items.map((item: any, index: number) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-3 border-t text-sm">
                    <div className="col-span-6">
                      <div className="font-medium">{item.name}</div>
                      {item.customizations && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.customizations.mainOptions?.length > 0 && (
                            <div>Acompanhamentos: {item.customizations.mainOptions.map((opt: any) => opt.name).join(", ")}</div>
                          )}
                          {item.customizations.meatOptions?.length > 0 && (
                            <div>Carnes: {item.customizations.meatOptions.map((opt: any) => opt.name).join(", ")}</div>
                          )}
                          {item.customizations.extraOptions?.length > 0 && (
                            <div>Extras: {item.customizations.extraOptions.map((opt: any) => opt.name).join(", ")}</div>
                          )}
                          {item.customizations.notes && (
                            <div>Obs: {item.customizations.notes}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-2 text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                    </div>
                    <div className="col-span-2 text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice || (item.price * item.quantity))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totais */}
            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceData.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de Entrega:</span>
                  <span>
                    {invoiceData.taxaEntrega === 0 
                      ? "Grátis" 
                      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceData.taxaEntrega)
                    }
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-kumekume-orange print:text-black">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceData.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code de validação - only shown in non-print mode */}
            <div className="hidden print:block text-center py-4">
              <div className="inline-block border-2 border-gray-300 p-2 rounded-lg">
                <img 
                  src={generateValidationQRCode()} 
                  alt="QR Code de Validação" 
                  className="w-32 h-32 mx-auto"
                />
                <p className="text-xs mt-2 text-gray-600">
                  Escaneie para validar esta nota fiscal
                </p>
              </div>
            </div>

            {/* Rodapé */}
            <div className="text-center text-xs text-gray-500 border-t pt-4 print:pt-2">
              <p>Obrigado pela preferência!</p>
              <p>Este documento serve como comprovante de pedido.</p>
            </div>
          </div>

          <div className="flex justify-end mt-6 print:hidden">
            <Button onClick={handleCloseInvoice} variant="outline" className="mr-2">
              Fechar
            </Button>
            <Button 
              onClick={handlePrint} 
              style={{ 
                backgroundColor: '#fb923c', 
                color: 'white',
                border: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#ea580c';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#fb923c';
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-kumekume-orange" />
          <p className="mt-4 text-gray-600">Validando nota fiscal...</p>
        </div>
      </div>
    );
  }

  // If showing invoice, render only the invoice
  if (showInvoice && invoiceData) {
    return renderInvoice();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              <div className="text-2xl font-bold text-kumekume-orange">{platformName}</div>
              <p className="text-sm text-gray-600 mt-1">Validação de Nota Fiscal</p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              {isValid === true && invoiceData ? (
                <div className="space-y-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Nota Fiscal Válida</h2>
                    <p className="mt-2 text-gray-600">
                      A nota fiscal com número <span className="font-semibold">#{orderId}</span> foi verificada e está válida.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                    <h3 className="font-medium text-green-800">Informações da Nota Fiscal</h3>
                    <div className="mt-2 space-y-1 text-sm text-green-700">
                      <p><span className="font-medium">Número:</span> #{invoiceData.numeroOrdem}</p>
                      <p><span className="font-medium">Data:</span> {new Date(invoiceData.dataHora).toLocaleString('pt-BR')}</p>
                      <p><span className="font-medium">Valor Total:</span> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceData.total)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
                    <Button 
                      onClick={() => setShowInvoice(true)}
                      className="bg-kumekume-orange hover:bg-orange-600"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Nota Fiscal
                    </Button>
                    <Button 
                      onClick={handleBack}
                      variant="outline"
                    >
                      Voltar para o Início
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-10 w-10 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Nota Fiscal Inválida</h2>
                    <p className="mt-2 text-gray-600">
                      Não foi possível validar a nota fiscal com número <span className="font-semibold">#{orderId}</span>.
                    </p>
                    {error && (
                      <div className="mt-4 flex items-center justify-center text-red-600 bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span className="text-sm">{error}</span>
                      </div>
                    )}
                    <p className="mt-4 text-gray-500 text-sm">
                      Verifique se o código QR foi escaneado corretamente ou entre em contato com o estabelecimento.
                    </p>
                  </div>
                  <div className="mt-8">
                    <Button 
                      onClick={handleBack}
                      className="bg-kumekume-orange hover:bg-orange-600"
                    >
                      Voltar para o Início
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Sistema de validação de notas fiscais - {platformName}</p>
        </div>
      </div>
    </div>
  );
};
