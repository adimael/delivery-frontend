import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Clock3,
  Instagram,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCategoriasProduto } from "@/hooks/useCategoriasProduto";
import {
  ConfiguracaoEstabelecimento,
  useEstabelecimento,
} from "@/hooks/useEstabelecimento";
import { useProdutos } from "@/hooks/useProdutos";
import { ProductCard, ProductProps } from "@/components/products/ProductCard";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import EnderecoForm from "@/components/profile/EnderecoForm";
import { apiRequest } from "@/lib/api";
import { createWhatsAppConversationUrl } from "@/lib/whatsapp";

const fallbackImage = "/placeholder.svg";

const booleano = (valor: unknown): boolean => (
  valor === true
  || valor === 1
  || ['1', 'true', 'sim'].includes(String(valor ?? '').trim().toLowerCase())
);

const horariosDaSemana = (
  configuracao: ConfiguracaoEstabelecimento | null,
): string[] => {
  const dias = [
    ['segunda', 'Segunda-feira'],
    ['terca', 'Terça-feira'],
    ['quarta', 'Quarta-feira'],
    ['quinta', 'Quinta-feira'],
    ['sexta', 'Sexta-feira'],
    ['sabado', 'Sábado'],
    ['domingo', 'Domingo'],
  ] as const;

  return dias.map(([chave, nome]) => {
    if (!booleano(configuracao?.[`aberto_${chave}`])) return `${nome}: fechado`;
    const abertura = configuracao?.[`hora_abertura_${chave}`]
      || configuracao?.hora_abertura
      || '08:00';
    const fechamento = configuracao?.[`hora_fechamento_${chave}`]
      || configuracao?.hora_fechamento
      || '18:00';
    return `${nome}: ${abertura} às ${fechamento}`;
  });
};

const linkInstagram = (valor?: string): string | null => {
  const informado = valor?.trim();
  if (!informado) return null;
  if (/^https?:\/\//i.test(informado)) return informado;

  const usuario = informado
    .replace(/^@/, '')
    .replace(/^(?:www\.)?instagram\.com\//i, '')
    .replace(/^\/+|\/+$/g, '');

  return usuario ? `https://www.instagram.com/${encodeURIComponent(usuario)}` : null;
};

export default function Index() {
  const { configuracao, estaAberto, loading: loadingConfig } = useEstabelecimento();
  const { produtos, loading: loadingProducts } = useProdutos();
  const { categorias, loading: loadingCategories } = useCategoriasProduto();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showCompany, setShowCompany] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    enderecos,
    loadingEnderecos,
    addEndereco,
    setEnderecoPrincipal,
  } = useUserProfile();

  const categoryList = useMemo(() => categorias, [categorias]);

  const products = useMemo<ProductProps[]>(() => {
    return produtos.map((produto) => ({
    id: produto.id,
    name: produto.nome,
    price: Number(produto.preco),
    description: produto.descricao || "",
    image: produto.url_imagem || fallbackImage,
    images: produto.imagens?.map(imagem => imagem.url).filter(Boolean)
      || [produto.url_imagem || fallbackImage],
    category: produto.categoria_id || "all",
    hasOptions: Boolean(
      (produto.categorias_opcoes?.length || 0) > 0
      || (produto.variacoes?.length || 0) > 0,
    ),
    }));
  }, [produtos]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch = !term || `${product.name} ${product.description}`
        .toLocaleLowerCase("pt-BR")
        .includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const groupedProducts = useMemo(() => categoryList
    .map((category) => ({
      ...category,
      products: visibleProducts.filter((product) => product.category === category.id),
    }))
    .filter((category) => category.products.length > 0), [categoryList, visibleProducts]);

  const ungrouped = visibleProducts.filter(
    (product) => !categoryList.some((category) => category.id === product.category),
  );

  const platformName = configuracao?.nome_plataforma || "Meu Delivery";
  const instagramUrl = linkInstagram(configuracao?.instagram);
  const whatsappUrl = createWhatsAppConversationUrl(configuracao?.whatsapp);
  const horarios = useMemo(() => horariosDaSemana(configuracao), [configuracao]);
  const possuiRedesSociais = Boolean(instagramUrl || whatsappUrl);
  const location = [
    configuracao?.endereco_estabelecimento,
    configuracao?.cidade_estabelecimento,
    configuracao?.estado_estabelecimento,
  ].filter(Boolean).join(" · ");

  const focusSearch = () => {
    searchRef.current?.focus();
    searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (
      user
      && !loadingEnderecos
      && sessionStorage.getItem("deliveryPostLoginAction") === "address"
    ) {
      sessionStorage.removeItem("deliveryPostLoginAction");
      setShowAddress(true);
      setShowAddressForm(enderecos.length === 0);
    }
  }, [enderecos.length, loadingEnderecos, user]);

  useEffect(() => {
    const storageKey = "deliveryVisitorId";
    let visitorId = localStorage.getItem(storageKey);
    if (!visitorId) {
      visitorId = typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(storageKey, visitorId);
    }

    const registrarPresenca = () => {
      if (document.visibilityState !== "visible") return;
      void apiRequest("/analytics/visit", {
        method: "POST",
        body: JSON.stringify({ visitante_id: visitorId }),
      }).catch(() => undefined);
    };

    registrarPresenca();
    const interval = window.setInterval(registrarPresenca, 90_000);
    document.addEventListener("visibilitychange", registrarPresenca);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", registrarPresenca);
    };
  }, []);

  const chooseAddress = () => {
    if (!user) {
      sessionStorage.setItem("deliveryPostLoginAction", "address");
      navigate("/login");
      return;
    }
    setShowAddress(true);
    setShowAddressForm(!loadingEnderecos && enderecos.length === 0);
  };

  return (
    <MainLayout onSearch={focusSearch}>
      <div className="delivery-page">
        <section className="delivery-store-card" aria-labelledby="store-name">
          {configuracao?.url_capa_plataforma && (
            <div className="delivery-cover-shell">
              <img className="delivery-store-cover" src={configuracao.url_capa_plataforma} alt="" />
              {possuiRedesSociais && (
                <nav className="delivery-cover-socials" aria-label="Redes sociais da loja">
                  {instagramUrl && (
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir Instagram">
                      <Instagram />
                    </a>
                  )}
                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Conversar pelo WhatsApp">
                      <MessageCircle />
                    </a>
                  )}
                </nav>
              )}
            </div>
          )}
          <div className="delivery-store-row">
            <div className="delivery-store-logo" aria-hidden={!configuracao?.url_icone_plataforma}>
              {configuracao?.url_icone_plataforma ? (
                <img src={configuracao.url_icone_plataforma} alt="" />
              ) : (
                <span>{platformName.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="delivery-store-copy">
              <p className="delivery-eyebrow">Cardápio digital</p>
              <h1 id="store-name">{platformName}</h1>
              <div className="delivery-store-badges">
                <span><Sparkles size={17} /> {configuracao?.slogan_plataforma || configuracao?.categoria_estabelecimento || "Peça pelo nosso cardápio digital"}</span>
                <span className={estaAberto ? "is-open" : "is-closed"}>
                  <Clock3 size={17} /> {estaAberto ? "Aberto" : "Fechado"}
                </span>
              </div>
            </div>
            <button className="delivery-store-more" type="button" onClick={() => setShowCompany(true)} aria-label="Ver informações da loja">
              <ChevronRight />
            </button>
          </div>

          <div className="delivery-benefits" aria-label="Vantagens">
            <article>
              <span><Sparkles /></span>
              <p><strong>Pedido do seu jeito</strong>Escolha tamanhos, sabores e adicionais.</p>
            </article>
            <article>
              <span><Clock3 /></span>
              <p><strong>Acompanhe tudo</strong>Veja cada etapa do preparo à entrega.</p>
            </article>
          </div>
        </section>

        <section className="delivery-menu-shell" id="cardapio">
          <div className="delivery-search" id="buscar">
            <Search aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="O que você quer comer?"
              aria-label="Pesquisar no cardápio"
            />
          </div>

          <nav className="delivery-category-strip" aria-label="Categorias do cardápio">
            <button
              type="button"
              className={selectedCategory === "all" ? "active" : ""}
              onClick={() => setSelectedCategory("all")}
            >
              Tudo
            </button>
            {categoryList.map((category) => (
              <button
                key={category.id}
                type="button"
                className={selectedCategory === category.id ? "active" : ""}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.nome}
              </button>
            ))}
          </nav>

          {(loadingProducts || loadingCategories || loadingConfig) ? (
            <div className="delivery-loading" role="status">
              <span />
              <p>Preparando o cardápio...</p>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="delivery-empty">
              <Search />
              <h2>Nenhum item encontrado</h2>
              <p>Tente buscar outro nome ou selecione uma categoria diferente.</p>
            </div>
          ) : selectedCategory !== "all" ? (
            <MenuSection
              title={categoryList.find((category) => category.id === selectedCategory)?.nome || "Cardápio"}
              products={visibleProducts}
            />
          ) : (
            <>
              {groupedProducts.map((category) => (
                <MenuSection key={category.id} title={category.nome} products={category.products} />
              ))}
              {ungrouped.length > 0 && <MenuSection title="Outros" products={ungrouped} />}
            </>
          )}
        </section>

        <section className="delivery-about" id="sobre">
          <p className="delivery-eyebrow">Sobre a loja</p>
          <h2>{platformName}</h2>
          <p>{configuracao?.descricao_plataforma || "Comida saborosa, preparada com cuidado e entregue onde você estiver."}</p>
          {location && <span><MapPin /> {location}</span>}
          <div className="delivery-opening-hours">
            <Clock3 />
            <div>
              <strong>Horário de funcionamento</strong>
              {horarios.map((horario) => <span key={horario}>{horario}</span>)}
            </div>
          </div>
        </section>
        <footer className="delivery-social-footer">
          {possuiRedesSociais && (
            <>
              <p>Siga e fale com {platformName}</p>
              <nav aria-label="Contato e redes sociais">
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  <Instagram />
                  <span>Instagram</span>
                </a>
              )}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle />
                  <span>WhatsApp</span>
                </a>
              )}
              </nav>
            </>
          )}
          <div className="delivery-credits">
            <a
              className="delivery-powered-by"
              href="https://vupi.us/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Conheça a tecnologia vupi.us API"
            >
              <small>Tecnologia</small>
              <strong>vupi.us API</strong>
            </a>
            <span>Desenvolvido por <strong>Adimael S.</strong></span>
            <nav aria-label="Contatos do desenvolvedor">
              <a href="https://api.whatsapp.com/send?phone=5573999738916&amp;type=phone_number&amp;app_absent=0" target="_blank" rel="noopener noreferrer">+55 73 99973-8916</a>
              <a href="https://adimael.github.io" target="_blank" rel="noopener noreferrer">adimael.github.io</a>
            </nav>
          </div>
        </footer>
      </div>

      {showCompany && (
        <div className="delivery-modal-backdrop" role="presentation">
          <section className="delivery-info-sheet" role="dialog" aria-modal="true" aria-labelledby="company-title">
            <header>
              <button type="button" onClick={() => setShowCompany(false)} aria-label="Fechar"><X /></button>
              <h2 id="company-title">Sobre a loja</h2>
            </header>
            <div className="delivery-info-brand">
              <div className="delivery-store-logo">
                {configuracao?.url_icone_plataforma
                  ? <img src={configuracao.url_icone_plataforma} alt="" />
                  : <span>{platformName.slice(0, 1).toUpperCase()}</span>}
              </div>
              <div><h3>{platformName}</h3><p>{configuracao?.descricao_plataforma || "Comida preparada com cuidado e entregue até você."}</p></div>
            </div>
            <article><MapPin /><div><h3>Endereço</h3><p>{location || "Endereço ainda não informado."}</p></div></article>
            <article>
              <Clock3 />
              <div>
                <h3>Horário de funcionamento</h3>
                <div className="delivery-info-hours">
                  {horarios.map((horario) => <p key={horario}>{horario}</p>)}
                </div>
              </div>
            </article>
            <article><Truck /><div><h3>Entrega</h3><p>Taxa a partir de {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(configuracao?.taxa_entrega || 0))}</p></div></article>
          </section>
        </div>
      )}

      {showAddress && (
        <div className="delivery-modal-backdrop" role="presentation">
          <section className="delivery-info-sheet delivery-address-sheet" role="dialog" aria-modal="true" aria-labelledby="address-title">
            <header>
              <button type="button" onClick={() => { setShowAddress(false); setShowAddressForm(false); }} aria-label="Fechar"><X /></button>
              <h2 id="address-title">Endereço de entrega</h2>
            </header>
            {loadingEnderecos ? (
              <div className="delivery-loading"><span /><p>Buscando seus endereços...</p></div>
            ) : showAddressForm || enderecos.length === 0 ? (
              <EnderecoForm
                onSave={addEndereco}
                onCancel={() => {
                  if (enderecos.length > 0) setShowAddressForm(false);
                  else setShowAddress(false);
                }}
              />
            ) : (
              <div className="delivery-address-list">
                <p>Escolha onde deseja receber o pedido.</p>
                {enderecos.map((endereco) => (
                  <button
                    key={endereco.id}
                    type="button"
                    className={endereco.principal ? "selected" : ""}
                    onClick={async () => {
                      await setEnderecoPrincipal(endereco.id);
                      localStorage.setItem("deliveryAddressId", endereco.id);
                      setShowAddress(false);
                    }}
                  >
                    <MapPin />
                    <span><strong>{endereco.nome_endereco}</strong><small>{endereco.endereco_completo}{endereco.numero ? `, ${endereco.numero}` : ""} · {endereco.cidade}</small></span>
                    {endereco.principal && <b>Principal</b>}
                  </button>
                ))}
                <button type="button" className="delivery-new-address" onClick={() => setShowAddressForm(true)}>+ Cadastrar novo endereço</button>
              </div>
            )}
          </section>
        </div>
      )}
    </MainLayout>
  );
}

function MenuSection({ title, products }: { title: string; products: ProductProps[] }) {
  return (
    <section className="delivery-category-section">
      <header><h2>{title}</h2><span>{products.length} {products.length === 1 ? "item" : "itens"}</span></header>
      <div className="delivery-product-list">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
