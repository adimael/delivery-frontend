
import { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ItemCarrinho {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  customizations?: any;
}

interface DadosCheckout {
  items: ItemCarrinho[];
  subtotal: number;
  taxaEntrega: number;
  total: number;
  endereco: string;
  nomeCliente: string;
  observacoes?: string;
  tipoEntrega: 'entrega' | 'retirada';
}

export const useCheckout = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const criarPedido = async (dadosCheckout: DadosCheckout) => {
    setLoading(true);
    
    try {

      // Gerar número do pedido
      const numeroPedido = `ADR${Date.now().toString().slice(-8)}`;

      // Endereço da loja para retirada
      const enderecoLoja = 'Av. Nélson Leite Leal, Nº 106\nTeotônio Calheira, Gandu-BA cep: 45450-000';

      // Preparar dados do pedido
      const dadosPedido = {
        numero_pedido: numeroPedido,
        cliente_id: user?.id || null,
        nome_cliente: dadosCheckout.nomeCliente,
        tipo_cliente: user ? 'logado' : 'convidado',
        valor_total: dadosCheckout.total,
        taxa_entrega: dadosCheckout.taxaEntrega,
        endereco_entrega: dadosCheckout.tipoEntrega === 'retirada' ? enderecoLoja : dadosCheckout.endereco,
        observacoes: dadosCheckout.observacoes,
        status: 'pendente' as const
      };


      // O backend cria pedido e itens na mesma requisição.
      const itensParaInserir = dadosCheckout.items.map(item => ({
        produto_id: item.id,
        quantidade: item.quantity,
        preco_unitario: item.price,
        preco_total: item.totalPrice,
        observacoes: JSON.stringify({
          nome: item.name,
          customizations: item.customizations
        })
      }));

      const pedido = await apiRequest(user ? '/pedidos' : '/checkout', {
        method: 'POST',
        body: JSON.stringify({ ...dadosPedido, itens_pedido: itensParaInserir })
      });

      toast({
        title: "Pedido realizado com sucesso!",
        description: `Seu pedido #${pedido.numero_pedido} foi recebido e está sendo processado.`,
      });

      return pedido;
    } catch (error) {
      console.error('Erro no checkout:', error);
      toast({
        title: "Erro ao processar pedido",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    criarPedido,
    loading
  };
};
