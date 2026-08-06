
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { User, Mail, Phone, Shield } from "lucide-react";

const DeliveryProfile = () => {
  const { profile, loading, updateProfile } = useUserProfile();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    telefone: '',
  });

  // Atualizar formData quando profile carregar
  useEffect(() => {
    if (profile) {
      setFormData({
        nome_completo: profile.nome_completo || '',
        telefone: profile.telefone || '',
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    const success = await updateProfile(formData);
    
    if (success) {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      setIsEditing(false);
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Meu Perfil" userType="delivery">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kumekume-orange"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Meu Perfil" userType="delivery">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={isEditing ? formData.nome_completo : profile?.nome_completo || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nome_completo: e.target.value
                  }))}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <Input
                    id="telefone"
                    value={isEditing ? formData.telefone : profile?.telefone || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      telefone: e.target.value
                    }))}
                    disabled={!isEditing}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Usuário</Label>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Entregador
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        nome_completo: profile?.nome_completo || '',
                        telefone: profile?.telefone || '',
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveProfile}>
                    Salvar Alterações
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Editar Perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default DeliveryProfile;
