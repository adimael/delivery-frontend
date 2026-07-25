
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { apiRequest } from "@/lib/api";

const ManagerProfile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useUserProfile();
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  
  // Estados para perfil
  const [nomeCompleto, setNomeCompleto] = useState(profile?.nome_completo || "");
  const [telefone, setTelefone] = useState(profile?.telefone || "");
  
  // Estados para alteração de senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");

  // Atualizar os estados quando o profile carregar
  useEffect(() => {
    if (profile) {
      setNomeCompleto(profile.nome_completo || "");
      setTelefone(profile.telefone || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!nomeCompleto.trim()) {
      toast({
        title: "Erro",
        description: "Nome completo é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setLoadingProfile(true);
    const success = await updateProfile({ 
      nome_completo: nomeCompleto,
      telefone: telefone || undefined
    });
    
    if (success) {
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso.",
      });
      setEditingProfile(false);
    } else {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil.",
        variant: "destructive",
      });
    }
    setLoadingProfile(false);
  };

  const handleCancelProfile = () => {
    setNomeCompleto(profile?.nome_completo || "");
    setTelefone(profile?.telefone || "");
    setEditingProfile(false);
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!senhaAtual || !novaSenha || !confirmacaoSenha) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (novaSenha !== confirmacaoSenha) {
      toast({
        title: "Erro",
        description: "A nova senha e a confirmação não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (novaSenha.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoadingProfile(true);

    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: senhaAtual,
          newPassword: novaSenha
        })
      });
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso.",
      });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacaoSenha("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro inesperado ao alterar senha.",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <DashboardLayout title="Meu Perfil" userType="manager">
      <div className="space-y-6">
        {/* Informações do Perfil */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Suas informações de perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo</Label>
                {editingProfile ? (
                  <Input 
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    disabled={loadingProfile}
                  />
                ) : (
                  <Input value={profile?.nome_completo || ""} disabled />
                )}
              </div>
              <div>
                <Label>E-mail</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div>
                <Label>Telefone</Label>
                {editingProfile ? (
                  <Input 
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    disabled={loadingProfile}
                    placeholder="(11) 99999-9999"
                  />
                ) : (
                  <Input value={profile?.telefone || ""} disabled />
                )}
              </div>
              <div>
                <Label>Tipo de Usuário</Label>
                <Input value="Gerente" disabled />
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              {editingProfile ? (
                <>
                  <Button 
                    onClick={handleSaveProfile}
                    className="bg-kumekume-orange hover:bg-orange-600"
                    disabled={loadingProfile}
                  >
                    {loadingProfile ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelProfile}
                    disabled={loadingProfile}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setEditingProfile(true)}
                  className="bg-kumekume-orange hover:bg-orange-600"
                >
                  Editar Perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alteração de Senha */}
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Mantenha sua conta segura alterando sua senha regularmente</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAlterarSenha} className="space-y-4">
              <div>
                <Label htmlFor="senha-atual">Senha Atual</Label>
                <Input 
                  id="senha-atual"
                  type="password" 
                  placeholder="••••••••"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  disabled={loadingProfile}
                />
              </div>
              <div>
                <Label htmlFor="nova-senha">Nova Senha</Label>
                <Input 
                  id="nova-senha"
                  type="password" 
                  placeholder="••••••••"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  disabled={loadingProfile}
                />
              </div>
              <div>
                <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
                <Input 
                  id="confirmar-senha"
                  type="password" 
                  placeholder="••••••••"
                  value={confirmacaoSenha}
                  onChange={(e) => setConfirmacaoSenha(e.target.value)}
                  disabled={loadingProfile}
                />
              </div>
              <Button 
                type="submit" 
                className="bg-kumekume-orange hover:bg-orange-600"
                disabled={loadingProfile}
              >
                {loadingProfile ? "Alterando..." : "Alterar Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManagerProfile;
