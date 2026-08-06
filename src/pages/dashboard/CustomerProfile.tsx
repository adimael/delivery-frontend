import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { confirmAction } from "@/components/ui/confirmation-host";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Plus } from "lucide-react";
import EnderecoForm from "@/components/profile/EnderecoForm";
import EnderecoCard from "@/components/profile/EnderecoCard";
import { Endereco } from "@/hooks/useUserProfile";

// Função para formatar telefone
const formatTelefone = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // If no digits, return empty string
  if (digits.length === 0) {
    return '';
  }
  
  // Limit to 11 digits for Brazilian phone numbers
  const limitedDigits = digits.slice(0, 11);
  
  // Format based on length
  if (limitedDigits.length <= 2) {
    return limitedDigits;
  }
  if (limitedDigits.length <= 6) {
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
  }
  if (limitedDigits.length <= 10) {
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 6)}-${limitedDigits.slice(6)}`;
  }
  return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7, 11)}`;
};

const CustomerProfile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    profile, 
    enderecos, 
    loading, 
    loadingEnderecos,
    updateProfile, 
    addEndereco,
    updateEndereco,
    deleteEndereco,
    setEnderecoPrincipal
  } = useUserProfile();
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showEnderecoForm, setShowEnderecoForm] = useState(false);
  const [editingEndereco, setEditingEndereco] = useState<Endereco | null>(null);
  
  // Estados para perfil
  const [nomeCompleto, setNomeCompleto] = useState(profile?.nome_completo || "");
  const [telefone, setTelefone] = useState(profile?.telefone || "");
  
  // Atualizar o estado do nome quando o profile carregar
  useEffect(() => {
    if (profile?.nome_completo) {
      setNomeCompleto(profile.nome_completo);
    }
    if (profile?.telefone) {
      setTelefone(profile.telefone);
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
    
    // Prepare telefone data - remove formatting for database storage
    const telefoneDigits = telefone.replace(/\D/g, '');
    const telefoneToSave = telefoneDigits.length > 0 ? telefone : null;
    
    const success = await updateProfile({ 
      nome_completo: nomeCompleto,
      telefone: telefoneToSave
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

  const handleSaveEndereco = async (enderecoData: Omit<Endereco, 'id' | 'criado_em'>) => {
    if (editingEndereco) {
      try {
        const success = await updateEndereco(editingEndereco.id, enderecoData);
        if (success) {
          toast({
            title: "Sucesso",
            description: "Endereço atualizado com sucesso.",
          });
          setEditingEndereco(null);
          return true;
        } else {
          toast({
            title: "Erro",
            description: "Erro ao atualizar endereço.",
            variant: "destructive",
          });
          return false;
        }
      } catch (error: unknown) {
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : String(error),
          variant: "destructive",
        });
        return false;
      }
    } else {
      try {
        const success = await addEndereco(enderecoData);
        if (success) {
          toast({
            title: "Sucesso",
            description: "Endereço adicionado com sucesso.",
          });
          setShowEnderecoForm(false);
          return true;
        } else {
          toast({
            title: "Erro",
            description: "Erro ao adicionar endereço.",
            variant: "destructive",
          });
          return false;
        }
      } catch (error: unknown) {
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : String(error),
          variant: "destructive",
        });
        return false;
      }
    }
  };

  const handleDeleteEndereco = async (id: string) => {
    if (await confirmAction({
      title: "Excluir endereço?",
      description: "Este endereço salvo será removido da sua conta.",
    })) {
      const success = await deleteEndereco(id);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Endereço excluído com sucesso.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir endereço.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSetPrincipal = async (id: string) => {
    const success = await setEnderecoPrincipal(id);
    if (success) {
      toast({
        title: "Sucesso",
        description: "Endereço principal atualizado.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Erro ao definir endereço principal.",
        variant: "destructive",
      });
    }
  };

  const handleEditEndereco = (endereco: Endereco) => {
    setEditingEndereco(endereco);
    setShowEnderecoForm(true);
  };

  const handleCancelEnderecoForm = () => {
    setShowEnderecoForm(false);
    setEditingEndereco(null);
  };

  // Handler para o campo telefone com máscara
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatTelefone(e.target.value);
    setTelefone(formattedValue);
  };

  return (
    <DashboardLayout title="Meu Perfil" userType="customer">
      <div className="space-y-6">
        {/* Loading Spinner para perfil */}
        {loading && (
          <div className="flex flex-col items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-kumekume-orange mb-4"></div>
            <span className="text-gray-500">Carregando perfil...</span>
          </div>
        )}
        {/* Mensagem de erro se não encontrar perfil */}
        {!loading && !profile && (
          <div className="flex flex-col items-center py-12">
            <span className="text-red-500 font-semibold text-lg mb-2">Não foi possível carregar seu perfil.</span>
            <span className="text-gray-500">Tente recarregar a página ou entrar novamente.</span>
          </div>
        )}
        {/* Renderização normal se perfil carregado */}
        {!loading && profile && (
        <>
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
                <Input value={profile?.email || ""} disabled />
              </div>
              <div>
                <Label>Telefone</Label>
                {editingProfile ? (
                  <Input 
                    value={telefone}
                    onChange={handleTelefoneChange}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    disabled={loadingProfile}
                  />
                ) : (
                  <Input value={profile?.telefone || ""} disabled />
                )}
              </div>
              <div>
                <Label>Tipo de Usuário</Label>
                <Input value="Cliente" disabled />
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

        {/* Endereços */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Endereços Salvos</CardTitle>
                <CardDescription>Gerencie seus endereços de entrega</CardDescription>
              </div>
              {!showEnderecoForm && (
                <Button
                  onClick={() => setShowEnderecoForm(true)}
                  className="bg-kumekume-orange hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Endereço
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showEnderecoForm && (
              <div className="mb-6">
                <EnderecoForm
                  endereco={editingEndereco}
                  onSave={handleSaveEndereco}
                  onCancel={handleCancelEnderecoForm}
                  loading={loadingEnderecos}
                />
              </div>
            )}

            {loadingEnderecos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kumekume-orange mx-auto"></div>
                <p className="text-gray-500 mt-2">Carregando endereços...</p>
              </div>
            ) : enderecos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum endereço cadastrado ainda.</p>
                <p className="text-sm">Clique em "Novo Endereço" para adicionar seu primeiro endereço.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {enderecos.map((endereco) => (
                  <EnderecoCard
                    key={endereco.id}
                    endereco={endereco}
                    onEdit={handleEditEndereco}
                    onDelete={handleDeleteEndereco}
                    onSetPrincipal={handleSetPrincipal}
                    loading={loadingEnderecos}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerProfile;
