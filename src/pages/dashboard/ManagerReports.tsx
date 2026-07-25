
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useManagerData } from "@/hooks/useManagerData";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { BarChart3, FileText, Calendar, DollarSign } from "lucide-react";

const ManagerReports = () => {
  const { relatorios, loading, gerarRelatorio } = useManagerData();
  const { toast } = useToast();
  const [dataRelatorio, setDataRelatorio] = useState(new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);

  const handleGerarRelatorio = async () => {
    setGenerating(true);
    const success = await gerarRelatorio(dataRelatorio);
    
    if (success) {
      toast({
        title: "Relatório gerado",
        description: "O relatório foi gerado com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório.",
        variant: "destructive",
      });
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <DashboardLayout title="Relatórios" userType="manager">
        <div>Carregando relatórios...</div>
      </DashboardLayout>
    );
  }

  const totalVendasGeral = relatorios.reduce((sum, rel) => sum + Number(rel.total_vendas), 0);
  const totalPedidosGeral = relatorios.reduce((sum, rel) => sum + rel.total_pedidos, 0);

  return (
    <DashboardLayout title="Relatórios" userType="manager">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                <div>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVendasGeral)}
                  </div>
                  <p className="text-sm text-muted-foreground">Vendas Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                <div>
                  <div className="text-2xl font-bold">{totalPedidosGeral}</div>
                  <p className="text-sm text-muted-foreground">Pedidos Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{relatorios.length}</div>
              <p className="text-sm text-muted-foreground">Relatórios Gerados</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Gerar Novo Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="data">Data do Relatório</Label>
                <Input
                  id="data"
                  type="date"
                  value={dataRelatorio}
                  onChange={(e) => setDataRelatorio(e.target.value)}
                />
              </div>
              <Button onClick={handleGerarRelatorio} disabled={generating}>
                <Calendar className="mr-2 h-4 w-4" />
                {generating ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorios.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum relatório gerado ainda</p>
              ) : (
                relatorios.map((relatorio) => (
                  <div key={relatorio.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">
                        Relatório de {new Date(relatorio.data_relatorio).toLocaleDateString()}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Gerado em {new Date(relatorio.criado_em).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(relatorio.total_vendas)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {relatorio.total_pedidos} pedidos
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManagerReports;
