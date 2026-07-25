import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Endereco } from "@/hooks/useUserProfile";
import { buscarEnderecoPorCep, formatarCep } from "@/lib/cep";

interface EnderecoFormProps {
  endereco?: Endereco | null;
  onSave: (endereco: Omit<Endereco, 'id' | 'criado_em'>) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

const EnderecoForm = ({ endereco, onSave, onCancel, loading = false }: EnderecoFormProps) => {
  const [formData, setFormData] = useState({
    nome_endereco: endereco?.nome_endereco || "",
    endereco_completo: endereco?.endereco_completo || "",
    cep: endereco?.cep || "",
    cidade: endereco?.cidade || "",
    estado: endereco?.estado || "",
    bairro: endereco?.bairro || "",
    numero: endereco?.numero || "",
    complemento: endereco?.complemento || "",
    ponto_referencia: endereco?.ponto_referencia || "",
    principal: endereco?.principal || false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_endereco || !formData.endereco_completo) {
      return;
    }

    const success = await onSave(formData);
    if (success) {
      onCancel();
    }
  };

  // Handler para o campo CEP com máscara
  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatarCep(e.target.value);
    setFormData(prev => ({ ...prev, cep: formattedValue }));
    if (formattedValue.replace(/\D/g, '').length !== 8) return;

    try {
      const dados = await buscarEnderecoPorCep(formattedValue);
      if (!dados) return;
      setFormData(prev => ({
        ...prev,
        cep: dados.cep,
        endereco_completo: dados.logradouro || prev.endereco_completo,
        bairro: dados.bairro || prev.bairro,
        cidade: dados.cidade || prev.cidade,
        estado: dados.estado || prev.estado,
        complemento: prev.complemento || dados.complemento,
      }));
    } catch {
      // Os campos continuam editáveis quando o serviço de CEP estiver indisponível.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{endereco ? "Editar Endereço" : "Novo Endereço"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome_endereco">Nome do Endereço</Label>
            <Input
              id="nome_endereco"
              value={formData.nome_endereco}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_endereco: e.target.value }))}
              placeholder="Ex: Casa, Trabalho, Casa da Mãe"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="endereco_completo">Endereço Completo</Label>
            <Input
              id="endereco_completo"
              value={formData.endereco_completo}
              onChange={(e) => setFormData(prev => ({ ...prev, endereco_completo: e.target.value }))}
              placeholder="Rua, Avenida, etc..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                placeholder="123"
              />
            </div>
            
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={handleCEPChange}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                placeholder="Centro"
              />
            </div>
            
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                placeholder="Digite a cidade"
              />
            </div>

            <div>
              <Label htmlFor="estado">UF</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  estado: e.target.value.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase(),
                }))}
                placeholder="BA"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              value={formData.complemento}
              onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
              placeholder="Apto 123, Bloco A, etc..."
            />
          </div>

          <div>
            <Label htmlFor="ponto_referencia">Ponto de referência</Label>
            <Input
              id="ponto_referencia"
              value={formData.ponto_referencia}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                ponto_referencia: e.target.value,
              }))}
              placeholder="Ex.: Próximo à praça, portão azul"
              maxLength={150}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="principal"
              checked={formData.principal}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, principal: !!checked }))}
            />
            <Label htmlFor="principal">Definir como endereço principal</Label>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button 
              type="submit" 
              className="bg-kumekume-orange hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnderecoForm;
