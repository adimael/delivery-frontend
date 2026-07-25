import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Star } from "lucide-react";
import { Endereco } from "@/hooks/useUserProfile";

interface EnderecoCardProps {
  endereco: Endereco;
  onEdit: (endereco: Endereco) => void;
  onDelete: (id: string) => void;
  onSetPrincipal: (id: string) => void;
  loading?: boolean;
}

const EnderecoCard = ({ endereco, onEdit, onDelete, onSetPrincipal, loading = false }: EnderecoCardProps) => {
  return (
    <Card className={`${endereco.principal ? 'ring-2 ring-kumekume-orange' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {endereco.nome_endereco}
            {endereco.principal && (
              <Badge className="bg-kumekume-orange hover:bg-orange-600">
                <Star className="w-3 h-3 mr-1" />
                Principal
              </Badge>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(endereco)}
              disabled={loading}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(endereco.id)}
              disabled={loading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-600">
          {endereco.endereco_completo}
          {endereco.numero && `, ${endereco.numero}`}
        </p>
        
        {endereco.complemento && (
          <p className="text-sm text-gray-600">{endereco.complemento}</p>
        )}
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {endereco.bairro && <span>{endereco.bairro}</span>}
          {endereco.bairro && endereco.cidade && <span>•</span>}
          <span>{endereco.cidade}</span>
          {endereco.cep && (
            <>
              <span>•</span>
              <span>{endereco.cep}</span>
            </>
          )}
        </div>

        {!endereco.principal && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetPrincipal(endereco.id)}
              disabled={loading}
              className="text-kumekume-orange hover:text-orange-600"
            >
              <Star className="w-4 h-4 mr-1" />
              Definir como Principal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnderecoCard;