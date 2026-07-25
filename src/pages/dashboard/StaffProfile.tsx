
import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const StaffProfile = () => {
  const { profile, loading, updateProfile } = useUserProfile();
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    telefone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Carregar dados do perfil quando disponível
  React.useEffect(() => {
    if (profile) {
      setFormData({
        nome_completo: profile.nome_completo || '',
        telefone: profile.telefone || ''
      });
    }
  }, [profile]);

  if (loading) {
    return (
      <DashboardLayout title="Meu Perfil" userType="staff">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kumekume-orange"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSave = async () => {
    if (!profile) return;

    // Verificar quais campos foram alterados
    const changes: any = {};
    
    if (formData.nome_completo !== profile.nome_completo) {
      changes.nome_completo = formData.nome_completo;
    }
    
    if (formData.telefone !== (profile.telefone || '')) {
      changes.telefone = formData.telefone || null;
    }

    // Se não há alterações, apenas sair do modo de edição
    if (Object.keys(changes).length === 0) {
      setIsEditing(false);
      toast({
        title: "Nenhuma alteração",
        description: "Não há alterações para salvar.",
      });
      return;
    }

    const success = await updateProfile(changes);
    
    if (success) {
      setIsEditing(false);
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        nome_completo: profile.nome_completo || '',
        telefone: profile.telefone || ''
      });
    }
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    const result = await updatePassword(passwordData.newPassword);
    
    if (result.success) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
  };

  if (!profile) {
    return (
      <DashboardLayout title="Meu Perfil" userType="staff">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Erro ao carregar perfil.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Meu Perfil" userType="staff">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_completo">Nome Completo</Label>
                <Input
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="tipo_usuario">Tipo de Usuário</Label>
                <Input
                  id="tipo_usuario"
                  value={profile.tipo_usuario}
                  disabled
                  className="bg-gray-100 capitalize"
                />
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} className="bg-kumekume-orange hover:bg-orange-600">
                    Salvar Alterações
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="bg-kumekume-orange hover:bg-orange-600">
                  Editar Perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isChangingPassword ? (
              <Button 
                onClick={() => setIsChangingPassword(true)} 
                variant="outline"
                className="w-full md:w-auto"
              >
                Alterar Senha
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Digite a nova senha"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirme a nova senha"
                  />
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handlePasswordChange} 
                    className="bg-kumekume-orange hover:bg-orange-600"
                  >
                    Alterar Senha
                  </Button>
                  <Button onClick={handleCancelPasswordChange} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffProfile;
