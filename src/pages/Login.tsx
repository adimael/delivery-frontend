import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/common/Logo";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { configuracao } = useEstabelecimento();
  const platformName = configuracao?.nome_plataforma || "Meu Delivery";

  const [activeTab, setActiveTab] = useState("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");
  const [carregandoLogin, setCarregandoLogin] = useState(false);
  const [loginFalhou, setLoginFalhou] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [emailCadastro, setEmailCadastro] = useState("");
  const [senhaCadastro, setSenhaCadastro] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<"cliente" | "entregador">("cliente");
  const [carregandoCadastro, setCarregandoCadastro] = useState(false);

  const passwordRules = useMemo(() => [
    { label: "8 caracteres", valid: senhaCadastro.length >= 8 },
    { label: "Letra maiúscula", valid: /[A-Z]/.test(senhaCadastro) },
    { label: "Letra minúscula", valid: /[a-z]/.test(senhaCadastro) },
    { label: "Número", valid: /\d/.test(senhaCadastro) },
    { label: "Símbolo", valid: /[^a-zA-Z0-9]/.test(senhaCadastro) },
  ], [senhaCadastro]);
  const passwordIsValid = passwordRules.every((rule) => rule.valid);
  const passwordsMatch = confirmacaoSenha.length > 0 && senhaCadastro === confirmacaoSenha;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailLogin.trim() || !senhaLogin) return;
    setCarregandoLogin(true);
    setLoginFalhou(false);
    try {
      const result = await signIn(emailLogin.trim().toLowerCase(), senhaLogin);
      if (!result.success) {
        setLoginFalhou(true);
        toast({ title: "Não foi possível entrar", description: result.error || "Confira seus dados e tente novamente.", variant: "destructive" });
        return;
      }
      toast({ title: "Acesso realizado", description: `Bem-vindo(a) ao ${platformName}.` });
      navigate(sessionStorage.getItem("deliveryPostLoginAction") === "address" ? "/" : "/dashboard-redirect");
    } catch (error) {
      setLoginFalhou(true);
      toast({ title: "Não foi possível entrar", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleCadastro = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordIsValid || !passwordsMatch) {
      toast({ title: "Revise sua senha", description: "Cumpra os requisitos e confirme a mesma senha.", variant: "destructive" });
      return;
    }
    setCarregandoCadastro(true);
    try {
      const result = await signUp(emailCadastro.trim().toLowerCase(), senhaCadastro, nomeCompleto.trim(), tipoUsuario);
      if (!result.success) {
        toast({ title: "Não foi possível criar a conta", description: result.error || "Revise os dados e tente novamente.", variant: "destructive" });
        return;
      }
      if (result.pendingApproval) {
        toast({
          title: "Cadastro enviado para análise",
          description: "Você poderá acessar as entregas depois que a equipe aprovar sua conta.",
        });
        setActiveTab("login");
        setEmailLogin(emailCadastro.trim().toLowerCase());
        setEmailCadastro("");
        setSenhaCadastro("");
        setConfirmacaoSenha("");
        setNomeCompleto("");
        return;
      }
      toast({ title: "Conta criada", description: "Agora entre usando seu e-mail e senha." });
      setEmailLogin(emailCadastro.trim().toLowerCase());
      setSenhaLogin("");
      setActiveTab("login");
      setEmailCadastro("");
      setSenhaCadastro("");
      setConfirmacaoSenha("");
      setNomeCompleto("");
    } catch (error) {
      toast({ title: "Não foi possível criar a conta", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setCarregandoCadastro(false);
    }
  };

  return (
    <main className="delivery-auth-page">
      <section className="delivery-auth-showcase" aria-label={`Acesso ao ${platformName}`}>
        <button type="button" className="delivery-auth-back" onClick={() => navigate("/", { replace: true })}>
          <ArrowLeft />
          <span>Voltar ao cardápio</span>
        </button>
        <div className="delivery-auth-brand"><Logo /></div>
        <div className="delivery-auth-message">
          <span className="delivery-auth-kicker">Seu pedido, do seu jeito</span>
          <h1>Entre para acompanhar tudo em um só lugar.</h1>
          <p>Salve endereços, acompanhe pedidos e consulte seu histórico com praticidade.</p>
        </div>
        <div className="delivery-auth-benefits">
          <span><ShoppingBag /> Pedidos organizados</span>
          <span><Truck /> Acompanhamento fácil</span>
        </div>
      </section>

      <section className="delivery-auth-panel">
        <div className="delivery-auth-mobile-head">
          <button type="button" onClick={() => navigate("/", { replace: true })} aria-label="Voltar ao cardápio"><ArrowLeft /></button>
          <Logo />
        </div>
        <div className="delivery-auth-card">
          <header>
            <span className="delivery-auth-kicker">Área segura</span>
            <h2>{activeTab === "login" ? "Acesse sua conta" : "Crie sua conta"}</h2>
            <p>{activeTab === "login" ? "Informe seus dados para continuar." : "Leva menos de um minuto."}</p>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="delivery-auth-tabs">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="delivery-auth-form" onSubmit={handleLogin}>
                <div>
                  <Label htmlFor="login-email">E-mail</Label>
                  <div className="delivery-auth-input"><Mail /><Input id="login-email" type="email" inputMode="email" autoComplete="email" placeholder="seu@email.com" value={emailLogin} onChange={(event) => setEmailLogin(event.target.value)} disabled={carregandoLogin} required /></div>
                </div>
                <div>
                  <div className="delivery-auth-label-row"><Label htmlFor="login-password">Senha</Label><Link to="/forgot-password">Recuperar acesso</Link></div>
                  <div className="delivery-auth-input"><LockKeyhole /><Input id="login-password" type={showLoginPassword ? "text" : "password"} autoComplete="current-password" placeholder="Digite sua senha" value={senhaLogin} onChange={(event) => setSenhaLogin(event.target.value)} disabled={carregandoLogin} required /><button type="button" onClick={() => setShowLoginPassword((value) => !value)} aria-label={showLoginPassword ? "Ocultar senha" : "Mostrar senha"}>{showLoginPassword ? <EyeOff /> : <Eye />}</button></div>
                </div>
                <Button type="submit" className="delivery-auth-submit btn-primary" disabled={carregandoLogin || !emailLogin.trim() || !senhaLogin}>
                  {carregandoLogin ? <><Loader2 className="animate-spin" /> Entrando...</> : <>Entrar <ChevronRight /></>}
                </Button>
                {loginFalhou && (
                  <div className="delivery-auth-help" role="status">
                    <strong>Ainda não possui uma conta?</strong>
                    <p>Você também pode criar seu cadastro usando o mesmo e-mail informado.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailCadastro(emailLogin.trim().toLowerCase());
                        setSenhaCadastro("");
                        setConfirmacaoSenha("");
                        setActiveTab("register");
                      }}
                    >
                      Criar conta com este e-mail
                    </button>
                  </div>
                )}
                <button type="button" className="delivery-auth-guest" onClick={() => navigate("/")}>Continuar sem conta</button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form className="delivery-auth-form" onSubmit={handleCadastro}>
                <fieldset className="delivery-account-type">
                  <legend>Como você usará a plataforma?</legend>
                  <button type="button" className={tipoUsuario === "cliente" ? "is-active" : ""} onClick={() => setTipoUsuario("cliente")}><UserRound /><span><strong>Cliente</strong><small>Fazer e acompanhar pedidos</small></span></button>
                  <button type="button" className={tipoUsuario === "entregador" ? "is-active" : ""} onClick={() => setTipoUsuario("entregador")}><Truck /><span><strong>Entregador</strong><small>Cadastro sujeito à aprovação da gerência</small></span></button>
                </fieldset>
                <div><Label htmlFor="register-name">Nome completo</Label><div className="delivery-auth-input"><UserRound /><Input id="register-name" autoComplete="name" placeholder="Como podemos chamar você?" value={nomeCompleto} onChange={(event) => setNomeCompleto(event.target.value)} required /></div></div>
                <div><Label htmlFor="register-email">E-mail</Label><div className="delivery-auth-input"><Mail /><Input id="register-email" type="email" inputMode="email" autoComplete="email" placeholder="seu@email.com" value={emailCadastro} onChange={(event) => setEmailCadastro(event.target.value)} required /></div></div>
                <div><Label htmlFor="register-password">Crie uma senha</Label><div className="delivery-auth-input"><LockKeyhole /><Input id="register-password" type={showRegisterPassword ? "text" : "password"} autoComplete="new-password" placeholder="Uma senha segura" value={senhaCadastro} onChange={(event) => setSenhaCadastro(event.target.value)} required /><button type="button" onClick={() => setShowRegisterPassword((value) => !value)} aria-label={showRegisterPassword ? "Ocultar senha" : "Mostrar senha"}>{showRegisterPassword ? <EyeOff /> : <Eye />}</button></div></div>
                <div className="delivery-password-rules">{passwordRules.map((rule) => <span className={rule.valid ? "is-valid" : ""} key={rule.label}><Check /> {rule.label}</span>)}</div>
                <div><Label htmlFor="register-confirm-password">Confirme a senha</Label><div className={`delivery-auth-input ${passwordsMatch ? "is-valid" : ""}`}><LockKeyhole /><Input id="register-confirm-password" type={showRegisterPassword ? "text" : "password"} autoComplete="new-password" placeholder="Digite novamente" value={confirmacaoSenha} onChange={(event) => setConfirmacaoSenha(event.target.value)} required /></div></div>
                <Button type="submit" className="delivery-auth-submit btn-primary" disabled={carregandoCadastro || !nomeCompleto.trim() || !emailCadastro.trim()}>
                  {carregandoCadastro ? <><Loader2 className="animate-spin" /> Criando...</> : <>Criar conta <ChevronRight /></>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="delivery-auth-terms">Ao continuar, você declara estar de acordo com os termos e a política de privacidade.</p>
        </div>
      </section>
    </main>
  );
}
