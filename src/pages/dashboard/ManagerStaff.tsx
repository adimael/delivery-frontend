
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ShieldCheck, XCircle } from "lucide-react";
import { useStaff } from "@/hooks/useStaff";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StaffTipo = "funcionario" | "entregador" | "gerente";

interface ManagerStaffProps {
  tipoUsuario?: "funcionario" | "entregador";
}

const ManagerStaff = ({ tipoUsuario = "funcionario" }: ManagerStaffProps) => {
  const { staff, loading, criarFuncionario, atualizarFuncionario, excluirFuncionario } = useStaff();
  const { toast } = useToast();
  const isDeliveryPage = tipoUsuario === "entregador";
  const entityName = isDeliveryPage ? "Entregador" : "Funcionário";
  const entityNamePlural = isDeliveryPage ? "Entregadores" : "Funcionários";
  const visibleStaff = staff.filter(member => member.tipo_usuario === tipoUsuario);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome_completo: '',
    telefone: '',
    tipo_usuario: tipoUsuario as StaffTipo,
    email: '',
    senha: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let result;
    if (editingStaff) {
      result = await atualizarFuncionario(editingStaff, formData);
    } else {
      result = await criarFuncionario(formData);
    }

    if (result.success) {
      toast({
        title: editingStaff ? `${entityName} atualizado` : `${entityName} criado`,
        description: `${entityName} salvo com sucesso`,
      });
      setIsDialogOpen(false);
      setEditingStaff(null);
      setFormData({
        nome_completo: '',
        telefone: '',
        tipo_usuario: tipoUsuario as StaffTipo,
        email: '',
        senha: ''
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Ocorreu um erro ao salvar o funcionário",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (staffMember: any) => {
    setEditingStaff(staffMember.id);
    setFormData({
      nome_completo: staffMember.nome_completo,
      telefone: staffMember.telefone,
      tipo_usuario: staffMember.tipo_usuario as StaffTipo,
      email: staffMember.email || '',
      senha: ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await excluirFuncionario(id);
    
    if (result.success) {
      toast({
        title: `${entityName} removido`,
        description: `${entityName} removido com sucesso`,
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Ocorreu um erro ao remover o funcionário",
        variant: "destructive",
      });
    }
  };

  const handleApproval = async (id: string, approve: boolean) => {
    const result = await atualizarFuncionario(id, {
      ativo: approve,
      status_aprovacao: approve ? "aprovado" : "rejeitado",
    });
    toast(result.success ? {
      title: approve ? "Entregador aprovado" : "Cadastro rejeitado",
      description: approve
        ? "O entregador agora pode solicitar entregas."
        : "Este cadastro não terá acesso aos dados de entrega.",
    } : {
      title: "Não foi possível analisar o cadastro",
      description: "Tente novamente.",
      variant: "destructive",
    });
  };

  const openCreateDialog = () => {
    setEditingStaff(null);
    setFormData({
      nome_completo: '',
      telefone: '',
      tipo_usuario: tipoUsuario as StaffTipo,
      email: '',
      senha: ''
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout title={entityNamePlural} userType="manager">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={entityNamePlural} userType="manager">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{entityNamePlural}</h1>
            <p className="text-gray-600">Gerencie os {entityNamePlural.toLowerCase()} cadastrados</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo {entityName}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleStaff.map((member) => (
            <Card key={member.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{member.nome_completo}</CardTitle>
                  <Badge variant={member.ativo ? "default" : "secondary"}>
                    {member.status_aprovacao === "pendente"
                      ? "Aguardando aprovação"
                      : member.status_aprovacao === "rejeitado"
                        ? "Rejeitado"
                        : member.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Telefone: {member.telefone}</p>
                    <p className="text-sm text-gray-600">Tipo: {member.tipo_usuario}</p>
                  </div>
                  
                  {isDeliveryPage && member.status_aprovacao === "pendente" && (
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <Button onClick={() => void handleApproval(member.id, true)}>
                        <ShieldCheck className="mr-1 h-4 w-4" /> Aprovar
                      </Button>
                      <Button variant="outline" onClick={() => void handleApproval(member.id, false)}>
                        <XCircle className="mr-1 h-4 w-4" /> Rejeitar
                      </Button>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(member)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(member.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? `Editar ${entityName}` : `Novo ${entityName}`}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome_completo">Nome Completo</Label>
                <Input
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <input type="hidden" name="tipo_usuario" value={formData.tipo_usuario} />

              <div>
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                  required={!editingStaff}
                  placeholder={editingStaff ? "Deixe vazio para manter a senha atual" : ""}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingStaff ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManagerStaff;
