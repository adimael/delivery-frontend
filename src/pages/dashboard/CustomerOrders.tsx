
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePedidos } from "@/hooks/useSupabaseData";

// Order status badge color mapping
const statusColorMap: Record<string, string> = {
  "pendente": "bg-yellow-500",
  "confirmado": "bg-blue-500",
  "preparando": "bg-blue-500",
  "pronto": "bg-purple-500",
  "saiu_entrega": "bg-purple-500",
  "entregue": "bg-green-500",
  "cancelado": "bg-red-500"
};

const statusLabelMap: Record<string, string> = {
  "pendente": "Aguardando",
  "confirmado": "Confirmado",
  "preparando": "Preparando",
  "pronto": "Pronto",
  "saiu_entrega": "Saiu para Entrega",
  "entregue": "Entregue",
  "cancelado": "Cancelado"
};

const CustomerOrders = () => {
  const { pedidos, loading } = usePedidos();

  if (loading) {
    return (
      <DashboardLayout title="Meus Pedidos" userType="customer">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kumekume-orange"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Meus Pedidos" userType="customer">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Histórico de Pedidos</h2>
        
        {pedidos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Você ainda não fez nenhum pedido.</p>
          </div>
        ) : (
          <Table>
            <TableCaption>Lista de pedidos recentes</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido #</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell className="font-medium">#{pedido.numero_pedido || pedido.id.slice(-8)}</TableCell>
                  <TableCell>
                    {new Date(pedido.criado_em).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </TableCell>
                  <TableCell>
                    <ul className="text-sm">
                      {pedido.itens_pedido.map((item, index) => {
                        let variacoes: string[] = [];
                        let observacoesPersonalizadas = "";
                        if (item.observacoes) {
                          try {
                            const obs = JSON.parse(item.observacoes);
                            // Verificações para diferentes formatos de variações
                            if (obs.customizations && obs.customizations.variations && typeof obs.customizations.variations === 'object') {
                              // Exemplo: { Tamanho: { nome: 'M' }, Cor: { nome: 'Azul' } }
                              variacoes = Object.entries(obs.customizations.variations).map(
                                ([tipo, valor]: [string, unknown]) => `- ${tipo}: ${typeof valor === 'object' && valor !== null && 'nome' in valor ? (valor as { nome: string }).nome : valor}`
                              );
                            } else if (obs.variacoes && typeof obs.variacoes === 'object') {
                              variacoes = Object.entries(obs.variacoes).map(
                                ([tipo, valor]) => `- ${tipo}: ${valor}`
                              );
                            } else if (obs.opcoes && typeof obs.opcoes === 'object') {
                              variacoes = Object.entries(obs.opcoes).map(
                                ([tipo, valor]) => `- ${tipo}: ${valor}`
                              );
                            } else if (obs.opcao) {
                              variacoes = [`- Opção: ${obs.opcao}`];
                            }
                            if (obs.customizations && obs.customizations.notes) {
                              observacoesPersonalizadas = obs.customizations.notes;
                            } else if (obs.observacoes) {
                              observacoesPersonalizadas = obs.observacoes;
                            }
                          } catch (e) {
                            // ignorar erro de parse
                          }
                        }
                        return (
                          <li key={index} className="mb-2">
                            <div>
                              {item.quantidade}x {item.produto_nome || 'Produto'}
                              {variacoes.length > 0 && (
                                <span className="ml-2 flex flex-wrap gap-1">
                                  {variacoes.map((v, i) => (
                                    <span key={i} className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs font-semibold">{v.replace('- ', '')}</span>
                                  ))}
                                </span>
                              )}
                            </div>
                            {observacoesPersonalizadas && (
                              <div className="ml-4 text-xs text-gray-500">Observações: {observacoesPersonalizadas}</div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColorMap[pedido.status] || "bg-gray-500"}>
                      {statusLabelMap[pedido.status] || pedido.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerOrders;
