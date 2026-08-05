
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { perfisAPI } from '@/lib/api';
import { User, Mail, Phone, Shield, Key } from "lucide-react";

interface StaffMember {
  id?: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  tipo_usuario: 'funcionario' | 'entregador' | 'gerente';
  ativo: boolean;
}

interface StaffFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: StaffMember;
  onSuccess: () => void;
  defaultType?: 'funcionario' | 'entregador';
}

const StaffFormModal = ({ open, onOpenChange, staff, onSuccess, defaultType = 'funcionario' }: StaffFormModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StaffMember>({
    nome_completo: staff?.nome_completo || '',
    email: staff?.email || '',
    telefone: staff?.telefone || '',
    tipo_usuario: staff?.tipo_usuario || defaultType,
    ativo: staff?.ativo ?? true
  });
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaGerada, setSenhaGerada] = useState('');
  const [alterarSenha, setAlterarSenha] = useState(false);

  const gerarSenhaAleatoria = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let senhaAleatoria = '';
    for (let i = 0; i < 8; i++) {
      senhaAleatoria += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setSenha(senhaAleatoria);
    setConfirmarSenha(senhaAleatoria);
    setSenhaGerada(senhaAleatoria);
  };

  const validarSenhas = () => {
    if (!staff?.id) {
      // Para novo funcionário, senha é obrigatória
      if (!senha) {
        toast({
          title: "Senha obrigatória",
          description: "Por favor, defina uma senha para o funcionário.",
          variant: "destructive",
        });
        return false;
      }
    } else if (alterarSenha) {
      // Para edição, só valida se escolheu alterar senha
      if (!senha) {
        toast({
          title: "Senha obrigatória",
          description: "Por favor, defina a nova senha para o funcionário.",
          variant: "destructive",
        });
        return false;
      }
    }

    if (senha && senha !== confirmarSenha) {
      toast({
        title: "Senhas não coincidem",
        description: "A senha e confirmação de senha devem ser iguais.",
        variant: "destructive",
      });
      return false;
    }

    if (senha && senha.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarSenhas()) {
      return;
    }

    setLoading(true);

    try {
      if (staff?.id) {
        // Atualizar funcionário existente
        const response = await perfisAPI.update(staff.id, {
          nome_completo: formData.nome_completo,
          telefone: formData.telefone,
          tipo_usuario: formData.tipo_usuario,
          ativo: formData.ativo
        });

        if (response.error) throw new Error(response.error);

        // Se escolheu alterar senha, atualizar no Auth
        if (alterarSenha && senha) {
          const passwordResponse = await perfisAPI.updatePassword(staff.id, senha);
          if (passwordResponse.error) throw new Error(passwordResponse.error);
        }

        toast({
          title: "Funcionário atualizado",
          description: "O funcionário foi atualizado com sucesso.",
        });
      } else {
        // Criar novo funcionário
        const authResponse = await perfisAPI.create({
          email: formData.email,
          password: senha,
          senha,
          nome_completo: formData.nome_completo,
          telefone: formData.telefone,
          tipo_usuario: formData.tipo_usuario,
        });

        if (authResponse.error) {
          throw new Error(authResponse.error);
        }

        const createdUser = authResponse.usuario ?? authResponse.user;
        if (createdUser) {
          // Atualizar o perfil do usuário criado
          const profileResponse = await perfisAPI.update(createdUser.id ?? createdUser.uuid, {
            nome_completo: formData.nome_completo,
            telefone: formData.telefone,
            tipo_usuario: formData.tipo_usuario,
            ativo: formData.ativo
          });

          if (profileResponse.error) {
            throw new Error(profileResponse.error);
          }

          toast({
            title: "Funcionário criado",
            description: `Funcionário criado com sucesso! Senha: ${senhaGerada || senha}`,
            duration: 10000,
          });
        }
      }

      onSuccess();
      onOpenChange(false);
      
      // Limpar formulário
      setFormData({
        nome_completo: '',
        email: '',
        telefone: '',
        tipo_usuario: defaultType,
        ativo: true
      });
      setSenha('');
      setConfirmarSenha('');
      setSenhaGerada('');
      setAlterarSenha(false);
      
    } catch (error: any) {
      console.error('Erro ao salvar funcionário:', error);
      
      let errorMessage = "Ocorreu um erro ao salvar o funcionário.";
      
      if (error.message?.includes('User already registered')) {
        errorMessage = "Este e-mail já está cadastrado no sistema.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "E-mail inválido.";
      } else if (error.message?.includes('Password')) {
        errorMessage = "Erro na senha. A senha deve ter pelo menos 6 caracteres.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Resetar formulário quando o modal abrir/fechar
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setFormData({
        nome_completo: staff?.nome_completo || '',
        email: staff?.email || '',
        telefone: staff?.telefone || '',
        tipo_usuario: staff?.tipo_usuario || defaultType,
        ativo: staff?.ativo ?? true
      });
      setSenha('');
      setConfirmarSenha('');
      setSenhaGerada('');
      setAlterarSenha(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {staff ? 'Editar Funcionário' : `Novo ${defaultType === 'funcionario' ? 'Funcionário' : 'Entregador'}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome_completo">Nome Completo *</Label>
            <Input
              id="nome_completo"
              value={formData.nome_completo}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={!!staff?.id}
            />
            {staff?.id && (
              <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado</p>
            )}
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="tipo_usuario">Tipo *</Label>
            <Select value={formData.tipo_usuario} onValueChange={(value: 'funcionario' | 'entregador' | 'gerente') => setFormData(prev => ({ ...prev, tipo_usuario: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="funcionario">Funcionário</SelectItem>
                <SelectItem value="entregador">Entregador</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos de senha - sempre visível para novo funcionário */}
          {!staff?.id && (
            <>
              <div>
                <Label htmlFor="senha">Senha *</Label>
                <div className="flex gap-2">
                  <Input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite uma senha"
                    required
                  />
                  <Button type="button" onClick={gerarSenhaAleatoria} variant="outline">
                    Gerar
                  </Button>
                </div>
                {senhaGerada && (
                  <p className="text-sm text-green-600 mt-1">
                    Senha gerada: <strong>{senhaGerada}</strong> (anote esta senha!)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Confirme a senha"
                  required
                />
              </div>
            </>
          )}

          {/* Para edição - opção de alterar senha */}
          {staff?.id && (
            <>
              <div className="flex items-center space-x-2">
                <Switch
                  id="alterarSenha"
                  checked={alterarSenha}
                  onCheckedChange={setAlterarSenha}
                />
                <Label htmlFor="alterarSenha">Alterar senha</Label>
              </div>

              {alterarSenha && (
                <>
                  <div>
                    <Label htmlFor="senha">Nova Senha *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Digite a nova senha"
                        required
                      />
                      <Button type="button" onClick={gerarSenhaAleatoria} variant="outline">
                        Gerar
                      </Button>
                    </div>
                    {senhaGerada && (
                      <p className="text-sm text-green-600 mt-1">
                        Nova senha gerada: <strong>{senhaGerada}</strong> (anote esta senha!)
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Confirme a nova senha"
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
            <Label htmlFor="ativo">Funcionário ativo</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StaffFormModal;
