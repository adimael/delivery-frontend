import { ChevronRight, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { useToast } from "@/hooks/use-toast";
import { ProductImageCarousel } from "./ProductImageCarousel";

export interface ProductProps {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  category: string;
  hasOptions?: boolean;
}

export const ProductCard = ({ product }: { product: ProductProps }) => {
  const { configuracao, estaAberto } = useEstabelecimento();
  const navigate = useNavigate();
  const { toast } = useToast();

  const addDirectly = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!estaAberto) {
      toast({
        title: `${configuracao?.nome_plataforma || "A loja"} está fechada`,
        description: "Você ainda pode consultar o cardápio e voltar no horário de atendimento.",
      });
      return;
    }
    // A tela de detalhes faz a decisão final. Uma falha na consulta das opções
    // nunca pode permitir que adicionais obrigatórios sejam ignorados.
    navigate(`/product/${product.id}`, { state: { product } });
  };

  return (
    <article className="delivery-product-card">
      <Link to={`/product/${product.id}`} state={{ product }} aria-label={`Ver ${product.name}`}>
        <div className="delivery-product-copy">
          <h3>{product.name}</h3>
          {product.hasOptions && <span className="delivery-product-customizable">Personalizável · possui adicionais</span>}
          {product.description && <p>{product.description}</p>}
          <strong>
            <small>A partir de</small>
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
          </strong>
        </div>
        <div className="delivery-product-visual">
          <ProductImageCarousel
            images={product.images?.length ? product.images : [product.image]}
            alt={product.name}
            controls={false}
          />
          <span className="delivery-product-arrow"><ChevronRight /></span>
        </div>
      </Link>
      <button type="button" className="delivery-quick-add" onClick={addDirectly} aria-label={`Adicionar ${product.name}`}>
        <Plus />
      </button>
    </article>
  );
};
