import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Printer, QrCode } from "lucide-react";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import type { MouseEvent } from "react";

interface ItemOption {
  name?: string;
  nome?: string;
  categoria?: string;
  quantidade?: number;
  preco_adicional?: number;
}

interface ItemCustomizations {
  mainOptions?: ItemOption[];
  meatOptions?: ItemOption[];
  extraOptions?: ItemOption[];
  selections?: ItemOption[];
  variations?: Record<string, ItemOption>;
  notes?: string;
}

const selecoesPorCategoria = (selecoes: ItemOption[] = []) =>
  selecoes.reduce<Record<string, ItemOption[]>>((grupos, opcao) => {
    const categoria = opcao.categoria || 'Outras opções';
    grupos[categoria] = [...(grupos[categoria] || []), opcao];
    return grupos;
  }, {});

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  totalPrice?: number;
  customizations?: ItemCustomizations;
}

interface InvoiceData {
  numeroOrdem: string | number;
  dataHora: string | number;
  formaPagamento: string;
  nomeDestinatario?: string;
  telefone?: string;
  endereco?: string;
  numero?: string | number;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  observacoes?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxaEntrega: number;
  desconto?: number;
  total: number;
  whatsappUrl?: string;
}

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  invoiceData: InvoiceData | null;
}

export const InvoiceModal = ({ open, onClose, invoiceData }: InvoiceModalProps) => {
  const { configuracao } = useEstabelecimento();
  
  // Use the platform name from configuration or default to "Plataforma"
  const platformName = configuracao?.nome_plataforma || "Plataforma";

  if (!invoiceData) return null;

  // Concatena todas as partes do endereço para checar se já existe a palavra 'cep'
  const fullAddressForCEPCheck = `${invoiceData.endereco || ''} ${invoiceData.numero || ''} ${invoiceData.complemento || ''} ${invoiceData.bairro || ''} ${invoiceData.cidade || ''} ${invoiceData.cep || ''}`.toLowerCase();

  const handlePrint = () => {
    // Add a small delay to ensure the print styles are applied
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Generate QR code URL for invoice validation
  const generateValidationQRCode = () => {
    // In a real implementation, this would point to your validation endpoint
    // For now, we'll use a placeholder that would work in a real deployment
    const validationUrl = `${window.location.origin}/validate-invoice/${invoiceData?.numeroOrdem}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(validationUrl)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full print-content">
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
                    {configuracao?.cidade_estabelecimento || "Teotônio Calheira"} {configuracao?.estado_estabelecimento}
                  </p>
                  {!configuracao?.endereco_estabelecimento?.toLowerCase().includes('cep') && (
                    <p className="text-sm">CEP: {configuracao?.cep_estabelecimento}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm">
                    {invoiceData.endereco}
                    {invoiceData.numero && !invoiceData.endereco.trim().endsWith(',') ? `, ${invoiceData.numero}` : ` ${invoiceData.numero || ''}`}
                    {invoiceData.complemento ? `, ${invoiceData.complemento}` : ''}
                  </p>
                  <p className="text-sm">{invoiceData.bairro}, {invoiceData.cidade}</p>
                  {!fullAddressForCEPCheck.includes('cep') && invoiceData.cep && (
                    <p className="text-sm">CEP: {invoiceData.cep}</p>
                  )}
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
              {(invoiceData.items || []).map((item: InvoiceItem, index: number) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 border-t text-sm">
                  <div className="col-span-6">
                    <div className="font-medium">{item.name}</div>
                    {item.customizations && (
                      <div className="text-xs text-gray-500 mt-1">
                        {item.customizations.mainOptions?.length > 0 && (
                          <div>Acompanhamentos: {item.customizations.mainOptions.map((opt: ItemOption) => opt.name).join(", ")}</div>
                        )}
                        {item.customizations.meatOptions?.length > 0 && (
                          <div>Carnes: {item.customizations.meatOptions.map((opt: ItemOption) => opt.name).join(", ")}</div>
                        )}
                        {item.customizations.extraOptions?.length > 0 && (
                          <div>Extras: {item.customizations.extraOptions.map((opt: ItemOption) => opt.name).join(", ")}</div>
                        )}
                        {item.customizations.variations
                          && Object.keys(item.customizations.variations).length > 0 && (
                          <div>
                            Variações: {Object.values(item.customizations.variations)
                              .map((opt) => opt.nome || opt.name)
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                        {Object.entries(
                          selecoesPorCategoria(item.customizations.selections),
                        ).map(([categoria, opcoes]) => (
                          <div key={categoria}>
                            <strong>{categoria}:</strong>{' '}
                            {opcoes.map((opcao) =>
                              `${Number(opcao.quantidade || 1)}x ${
                                opcao.nome || opcao.name || 'Opção'
                              }`,
                            ).join(', ')}
                          </div>
                        ))}
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
              {Number(invoiceData.desconto || 0) > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Desconto:</span>
                  <span>
                    -{new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Number(invoiceData.desconto))}
                  </span>
                </div>
              )}
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

        <div className="flex flex-col justify-end gap-2 mt-6 sm:flex-row print:hidden">
          {invoiceData.whatsappUrl && (
            <Button asChild className="min-h-11 bg-emerald-600 hover:bg-emerald-700">
              <a href={invoiceData.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar ao WhatsApp
              </a>
            </Button>
          )}
          <Button onClick={onClose} variant="outline" className="mr-2">
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
