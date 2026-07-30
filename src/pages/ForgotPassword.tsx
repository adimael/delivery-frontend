import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/common/Logo";
import { apiRequest } from "@/lib/api";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { configuracao } = useEstabelecimento();
  const platformName = configuracao?.nome_plataforma || "Delivery";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    setLoading(true);
    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });
      setEmail(normalizedEmail);
      setEmailSent(true);
      toast({
        title: "Solicitação recebida",
        description: "Se houver uma conta com esse e-mail, as instruções serão enviadas.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível solicitar agora",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="delivery-auth-page">
      <section className="delivery-auth-showcase" aria-label={`Recuperação de acesso ao ${platformName}`}>
        <button type="button" className="delivery-auth-back" onClick={() => navigate("/login", { replace: true })}>
          <ArrowLeft />
          <span>Voltar ao login</span>
        </button>
        <div className="delivery-auth-brand"><Logo /></div>
        <div className="delivery-auth-message">
          <span className="delivery-auth-kicker">Recuperação segura</span>
          <h1>Vamos ajudar você a voltar.</h1>
          <p>Informe seu e-mail e enviaremos as orientações para definir uma nova senha com segurança.</p>
        </div>
        <div className="delivery-auth-benefits">
          <span><ShieldCheck /> Link protegido e temporário</span>
          <span><Mail /> Instruções por e-mail</span>
        </div>
      </section>

      <section className="delivery-auth-panel">
        <div className="delivery-auth-mobile-head">
          <button type="button" onClick={() => navigate("/login", { replace: true })} aria-label="Voltar ao login"><ArrowLeft /></button>
          <Logo />
        </div>
        <div className="delivery-auth-card">
          <header>
            <span className="delivery-auth-kicker">Recuperar acesso</span>
            <h2>{emailSent ? "Confira seu e-mail" : "Esqueceu sua senha?"}</h2>
            <p>
              {emailSent
                ? "Por segurança, mostramos a mesma confirmação para qualquer endereço informado."
                : "Digite o e-mail usado na sua conta."}
            </p>
          </header>

          {!emailSent ? (
            <form className="delivery-auth-form" onSubmit={handleResetPassword}>
              <div>
                <Label htmlFor="recovery-email">E-mail</Label>
                <div className="delivery-auth-input">
                  <Mail />
                  <Input
                    id="recovery-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="delivery-auth-submit btn-primary" disabled={loading || !email.trim()}>
                {loading
                  ? <><Loader2 className="animate-spin" /> Enviando...</>
                  : <>Enviar instruções <ChevronRight /></>}
              </Button>
            </form>
          ) : (
            <div className="delivery-auth-success">
              <CheckCircle2 />
              <strong>Solicitação registrada</strong>
              <p>
                Se <b>{email}</b> estiver cadastrado, você receberá um link temporário para alterar sua senha.
              </p>
              <Button type="button" variant="outline" onClick={() => setEmailSent(false)}>
                Informar outro e-mail
              </Button>
            </div>
          )}

          <p className="delivery-auth-terms">
            <Link to="/login">Lembrou da senha? Voltar ao login</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;
