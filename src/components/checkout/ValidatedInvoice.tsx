import { useEffect } from "react";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { CheckCircle } from "lucide-react";
import { OrderItemDetails } from "@/components/orders/OrderItemDetails";

interface ItemOption {
  name: string;
}

interface ItemCustomizations {
  mainOptions?: ItemOption[];
  meatOptions?: ItemOption[];
  extraOptions?: ItemOption[];
  notes?: string;
}

interface InvoiceItem {
  id?: string;
  produto_nome?: string;
  observacoes?: string;
  quantidade: number;
  preco_unitario?: number;
  preco_total: number;
  preco_adicionais?: number;
  variacao_nome?: string | null;
  tipo_variacao?: string | null;
  selecoes?: any[] | string | null;
}

interface InvoiceData {
  numero_pedido?: string;
  criado_em?: string;
  status?: string;
  endereco_entrega?: string;
  observacoes?: string;
  itens_pedido?: InvoiceItem[];
  valor_total?: number;
  taxa_entrega?: number;
}

interface ValidatedInvoiceProps {
  invoiceData: InvoiceData;
}

export const ValidatedInvoice = ({ invoiceData }: ValidatedInvoiceProps) => {
  const { configuracao } = useEstabelecimento();
  
  // Use the platform name from configuration or default to "Plataforma"
  const platformName = configuracao?.nome_plataforma || "Plataforma";

  // Auto-print when component mounts
  useEffect(() => {
    const printTimer = setTimeout(() => {
      window.print();
    }, 1000);
    
    return () => clearTimeout(printTimer);
  }, []);

  // Parse item customizations
  const parseItemCustomizations = (observacoes?: string): ItemCustomizations | null => {
    try {
      if (!observacoes) return null;
      const parsed = JSON.parse(observacoes);
      return parsed.customizations || null;
    } catch (e) {
      return null;
    }
  };

  // Get item name
  const getItemName = (item: InvoiceItem) => {
    try {
      if (item.observacoes) {
        const parsed = JSON.parse(item.observacoes as string);
        return parsed?.nome || item.produto_nome || 'Produto';
      }
    } catch (e) {
      // Ignore error
    }
    return item.produto_nome || 'Produto';
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-600">NOTA FISCAL VÁLIDA</h1>
        <p className="text-lg mt-2">Esta nota fiscal foi verificada e está autêntica</p>
      </div>

      {/* Cabeçalho da empresa */}
      <div className="text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-kumekume-orange">{platformName}</h1>
        <p className="text-sm text-gray-600">{configuracao?.descricao_plataforma || "Pedido realizado pelo cardápio digital"}</p>
        {configuracao?.cnpj && (
          <p className="text-xs text-gray-500">CNPJ: {configuracao.cnpj}</p>
        )}
      </div>

      {/* Informações de validação */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="font-medium text-green-800">Nota Fiscal Validada com Sucesso</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-green-700">
          <p><span className="font-medium">Data da Validação:</span> {new Date().toLocaleString('pt-BR')}</p>
          <p><span className="font-medium">Status:</span> Autêntica</p>
        </div>
      </div>

      {/* Informações do pedido */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Dados do Pedido</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Número:</strong> #{invoiceData.numero_pedido}</p>
            <p><strong>Data/Hora:</strong> {new Date(invoiceData.criado_em).toLocaleString('pt-BR')}</p>
            <p><strong>Status:</strong> {invoiceData.status}</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Endereço de Entrega</h3>
          <div className="space-y-1 text-sm">
            {invoiceData.endereco_entrega && (
              <p>{invoiceData.endereco_entrega}</p>
            )}
            {invoiceData.observacoes && (
              <p><strong>Obs:</strong> {invoiceData.observacoes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Itens do pedido */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Itens do Pedido</h3>
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-2 bg-gray-50 p-3 text-sm font-medium">
            <div className="col-span-6">Item</div>
            <div className="col-span-2 text-center">Qtd</div>
            <div className="col-span-2 text-right">Preço Unit.</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
          <div className="grid gap-3 p-3">
            {(invoiceData.itens_pedido || []).map((item: InvoiceItem, index: number) => (
              <OrderItemDetails key={item.id || index} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Totais */}
      <div className="border-t pt-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceData.valor_total - invoiceData.taxa_entrega)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Taxa de Entrega:</span>
            <span>
              {invoiceData.taxa_entrega === 0 
                ? "Grátis" 
                : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceData.taxa_entrega)
              }
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span className="text-kumekume-orange">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceData.valor_total)}
            </span>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="text-center text-xs text-gray-500 border-t pt-4">
        <p>Obrigado pela preferência!</p>
        <p>Este documento serve como comprovante de pedido.</p>
        <p className="mt-2">Validação realizada em {new Date().toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
};
