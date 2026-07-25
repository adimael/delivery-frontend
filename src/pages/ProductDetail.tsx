import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProductOptionModal } from "@/components/products/ProductOptionModal";
import { useCartStore } from "@/stores/cartStore";
import { useProdutos } from "@/hooks/useSupabaseData";
import { useProductOptions } from "@/hooks/useProductOptions";
import { useProductVariations, ProductVariation } from "@/hooks/useProductVariations";
import { ProductProps } from "@/components/products/ProductCard";
import { ProductImageCarousel } from "@/components/products/ProductImageCarousel";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { estaAberto } = useEstabelecimento();
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasOptions, setHasOptions] = useState(false);
  const [optionSummary, setOptionSummary] = useState<{ categories: string[]; count: number }>({
    categories: [],
    count: 0,
  });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const addItem = useCartStore(state => state.addItem);
  const { produtos, loading } = useProdutos();
  const { getOpcoesParaProduto } = useProductOptions({ loadAdminData: false });
  // --- VARIAÇÕES ---
  const [selectedVariations, setSelectedVariations] = useState<{[tipo: string]: string}>({});
  const [productVariations, setProductVariations] = useState<ProductVariation[]>([]);
  const { getVariationsByProductAsync } = useProductVariations({ loadAdminData: false });
  // Converter produto do Supabase para o formato esperado
  const product = produtos.find(p => p.id === id);
  const navigationProduct = (
    location.state as { product?: ProductProps } | null
  )?.product;
  const variationTypes = [...new Set(productVariations.map(v => v.tipo_variacao))];

  // Verifica se todas as variações obrigatórias estão selecionadas
  const allVariationsSelected = variationTypes.length === 0 || variationTypes.every(type => selectedVariations[type]);

  const handleVariationChange = (tipo: string, variationId: string) => {
    setSelectedVariations(current => ({
      ...current,
      [tipo]: variationId
    }));
  };

  // Buscar variações do produto ao carregar a página
  const productFormatted: ProductProps | null = product ? {
    id: product.id,
    name: product.nome,
    price: Number(product.preco) || 0,
    description: product.descricao || '',
    image: product.url_imagem || "/placeholder.svg",
    images: product.imagens?.map(imagem => imagem.url).filter(Boolean)
      || [product.url_imagem || "/placeholder.svg"],
    category: product.categoria,
    hasOptions: hasOptions
  } : navigationProduct?.id === id ? navigationProduct : null;

  // Verificar se o produto tem opções ou variações quando carregado
  useEffect(() => {
    let active = true;
    if (!id) {
      setLoadingOptions(false);
      return () => { active = false; };
    }

    setLoadingOptions(true);
    void Promise.all([
      getOpcoesParaProduto(id),
      getVariationsByProductAsync(id),
    ]).then(([opcoes, variacoes]) => {
      if (!active) return;
      setProductVariations(variacoes);
      setHasOptions(opcoes.length > 0 || variacoes.length > 0);
      setOptionSummary({
        categories: [...new Set(opcoes.map((item) => item.categoria_nome).filter(Boolean))],
        count: new Set(opcoes.map((item) => item.opcao_id).filter(Boolean)).size,
      });
    }).catch(() => {
      if (!active) return;
      setProductVariations([]);
      setHasOptions(false);
      setOptionSummary({ categories: [], count: 0 });
    }).finally(() => {
      if (active) setLoadingOptions(false);
    });

    return () => { active = false; };
  }, [id]);
  
  if (loading && !productFormatted) {
    return (
      <MainLayout>
        <div className="delivery-product-detail-page" aria-busy="true">
          <div className="delivery-product-detail">
            <div className="delivery-detail-content animate-pulse" aria-hidden="true">
              <div className="delivery-detail-image bg-slate-200" />
              <div className="delivery-detail-options space-y-5">
                <div className="h-10 w-2/3 rounded-xl bg-slate-200" />
                <div className="h-9 w-1/3 rounded-xl bg-slate-200" />
                <div className="h-24 w-full rounded-xl bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!productFormatted) {
    return (
      <MainLayout>
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-2xl font-semibold mb-4">Produto não encontrado</h1>
            <Button onClick={() => navigate(-1)}>Voltar</Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  const handleAddToCart = (customizedProduct: unknown) => {
    if (!customizedProduct || typeof customizedProduct !== 'object') return;
    const prod = customizedProduct as { quantity: number; customizations: unknown; totalPrice: number };
    addItem({
      id: productFormatted.id,
      name: productFormatted.name,
      price: productFormatted.price,
      image: productFormatted.image,
      quantity: prod.quantity,
      customizations: prod.customizations,
      totalPrice: prod.totalPrice
    });
    toast({
      title: "Produto adicionado ao carrinho",
      description: `${prod.quantity}x ${productFormatted.name} adicionado com sucesso!`,
    });
  };
  
  const handleAddSimpleProduct = () => {
    addItem({
      id: productFormatted.id,
      name: productFormatted.name,
      price: productFormatted.price,
      image: productFormatted.image,
      quantity: quantity,
      totalPrice: productFormatted.price * quantity
    });
    
    toast({
      title: "Produto adicionado ao carrinho",
      description: `${quantity}x ${productFormatted.name} adicionado com sucesso!`,
    });
  };
  
  const handleOpenModal = () => {
    if (hasOptions) {
      setIsModalOpen(true);
      return;
    }
    // Se houver variações obrigatórias, só adiciona ao carrinho se todas estiverem selecionadas
    if (variationTypes.length > 0) {
      if (!allVariationsSelected) return;
      // Montar customização com as variações selecionadas
      const variationsSelected: Record<string, typeof productVariations[0]> = {};
      Object.entries(selectedVariations).forEach(([tipo, variationId]) => {
        const variation = productVariations.find(v => v.id === variationId);
        if (variation) {
          variationsSelected[tipo] = variation;
        }
      });
      const totalVariationsPrice = Object.values(variationsSelected).reduce((acc, v) => acc + (v.preco_adicional || 0) * quantity, 0);
      const customizedProduct = {
        ...productFormatted,
        quantity,
        customizations: {
          variations: variationsSelected
        },
        totalPrice: productFormatted!.price * quantity + totalVariationsPrice
      };
      handleAddToCart(customizedProduct);
      return;
    }
    handleAddSimpleProduct();
  };

  // Produtos relacionados da mesma categoria
  const relatedProducts = produtos
    .filter(p => p.id !== id && p.categoria === productFormatted.category)
    .slice(0, 4)
    .map(produto => ({
      id: produto.id,
      name: produto.nome,
      price: produto.preco,
      image: produto.url_imagem || "/placeholder.svg"
    }));

  return (
    <MainLayout>
      <div className="delivery-product-detail-page">
        <div className="delivery-product-detail">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="delivery-detail-back"
        >
          <span aria-hidden="true">←</span>
          <span className="sr-only">Voltar ao cardápio</span>
        </Button>
        
        <div className="delivery-detail-content">
          <div className="delivery-detail-image">
            <ProductImageCarousel
              images={productFormatted.images?.length
                ? productFormatted.images
                : [productFormatted.image]}
              alt={productFormatted.name}
              loading="eager"
            />
          </div>
          
          <div className="delivery-detail-options">
            <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">{productFormatted.name}</h1>
            <p className="text-3xl font-extrabold text-[hsl(var(--button-primary-bg))] mt-3">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(productFormatted.price)}
            </p>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium">Descrição</h3>
              <p className="mt-2 text-base leading-relaxed text-gray-600">{productFormatted.description}</p>
            </div>

            {optionSummary.categories.length > 0 && (
              <div className="delivery-customization-notice">
                <strong>Este produto possui adicionais</strong>
                <p>
                  {optionSummary.categories.join(" · ")}
                  {optionSummary.count > 0 ? ` · ${optionSummary.count} opção(ões)` : ""}
                </p>
                <small>Toque em “Personalizar” para escolher antes de adicionar ao carrinho.</small>
              </div>
            )}
            
            {/* Seção de Variações */}
            {variationTypes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2 capitalize">Variações <span className="text-sm text-gray-500 ml-2 font-normal">(Obrigatório)</span></h3>
                <div className="grid grid-cols-1 gap-3">
                  {variationTypes.map(tipo => (
                    <div key={tipo} className="mb-4">
                      <h3 className="text-lg font-semibold mb-2 capitalize">{tipo} <span className="text-sm text-gray-500 ml-2 font-normal">(Obrigatório)</span></h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {productVariations.filter(v => v.tipo_variacao === tipo && v.disponivel).map(variation => (
                          <label key={variation.id} className={`flex min-h-16 items-center justify-between rounded-xl border-2 p-4 cursor-pointer ${selectedVariations[tipo] === variation.id ? 'border-[hsl(var(--button-primary-bg))] bg-blue-50' : 'hover:bg-gray-50'}`} htmlFor={`variation-${variation.id}`}>
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                id={`variation-${variation.id}`}
                                name={`variation-${tipo}`}
                                checked={selectedVariations[tipo] === variation.id}
                                onChange={() => handleVariationChange(tipo, variation.id)}
                                className="h-6 w-6"
                              />
                              <span className="text-base font-semibold">{variation.nome}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {variation.preco_adicional > 0 && (
                                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(variation.preco_adicional)}</span>
                              )}
                              {variation.estoque > 0 && (
                                <span className="border border-gray-300 rounded px-2 py-0.5 text-xs">{variation.estoque} em estoque</span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!hasOptions && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Quantidade</h3>
                <div className="flex items-center space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    className="h-12 w-12 rounded-full text-xl"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="min-w-8 text-center text-2xl font-bold">{quantity}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    className="h-12 w-12 rounded-full text-xl"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-8">
              <Button 
                onClick={handleOpenModal}
                className="h-14 w-full text-lg font-bold md:w-auto md:px-8 btn-primary"
                disabled={loadingOptions || !estaAberto || (!hasOptions && variationTypes.length > 0 && !allVariationsSelected)}
                aria-busy={loadingOptions}
              >
                {loadingOptions
                  ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-label="Preparando produto" />
                  : !estaAberto
                  ? "Fechado no momento"
                  : !hasOptions && variationTypes.length > 0
                    ? "Adicionar ao Carrinho"
                    : (hasOptions ? "Personalizar" : "Adicionar ao Carrinho")}
              </Button>
              {!estaAberto && (
                <p className="delivery-closed-message">
                  No momento, não estamos aceitando novos pedidos. Você ainda pode consultar o cardápio.
                </p>
              )}
            </div>
          </div>
        </div>
        
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Você também pode gostar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(relatedProduct => (
                <div 
                  key={relatedProduct.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden card-hover cursor-pointer"
                  onClick={() => navigate(`/product/${relatedProduct.id}`, {
                    state: {
                      product: {
                        ...relatedProduct,
                        description: "",
                        category: productFormatted.category,
                      },
                    },
                  })}
                >
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={relatedProduct.image} 
                      alt={relatedProduct.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{relatedProduct.name}</h3>
                    <p className="text-[hsl(var(--button-primary-bg))] font-medium mt-2">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(relatedProduct.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
      
      {hasOptions && (
        <ProductOptionModal 
          product={productFormatted}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddToCart={handleAddToCart}
        />
      )}
    </MainLayout>
  );
};

export default ProductDetail;
