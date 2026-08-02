import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/common/Logo";
import { apiRequest } from "@/lib/api";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { configuracao } = useEstabelecimento();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";
  const platformName = configuracao?.nome_plataforma || "Delivery";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRules = useMemo(() => [
    { label: "8 caracteres", valid: password.length >= 8 },
    { label: "Letra maiúscula", valid: /[A-Z]/.test(password) },
    { label: "Letra minúscula", valid: /[a-z]/.test(password) },
    { label: "Número", valid: /\d/.test(password) },
    { label: "Símbolo", valid: /[^a-zA-Z0-9]/.test(password) },
  ], [password]);
  const passwordIsValid = passwordRules.every((rule) => rule.valid);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (token) return;
    toast({
      title: "Link inválido",
      description: "O link de recuperação está incompleto ou expirou.",
      variant: "destructive",
    });
    navigate("/forgot-password", { replace: true });
  }, [navigate, toast, token]);

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordIsValid) {
      toast({
        title: "Revise sua senha",
        description: "Cumpra todos os requisitos de segurança indicados.",
        variant: "destructive",
      });
      return;
    }
    if (!passwordsMatch) {
      toast({
        title: "As senhas não coincidem",
        description: "Digite a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password, senha: password }),
      });
      toast({
        title: "Senha atualizada",
        description: "Agora você já pode entrar usando sua nova senha.",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      toast({
        title: "Não foi possível alterar a senha",
        description: error instanceof Error
          ? error.message
          : "Solicite um novo link e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="delivery-auth-page">
      <section className="delivery-auth-showcase" aria-label={`Nova senha de acesso ao ${platformName}`}>
        <button type="button" className="delivery-auth-back" onClick={() => navigate("/login", { replace: true })}>
          <ArrowLeft />
          <span>Voltar ao login</span>
        </button>
        <div className="delivery-auth-brand"><Logo /></div>
        <div className="delivery-auth-message">
          <span className="delivery-auth-kicker">Proteção da sua conta</span>
          <h1>Crie uma nova senha segura.</h1>
          <p>Use uma combinação exclusiva e que você não utilize em outros serviços.</p>
        </div>
        <div className="delivery-auth-benefits">
          <span><ShieldCheck /> Link protegido e temporário</span>
          <span><LockKeyhole /> Token descartado após o uso</span>
        </div>
      </section>

      <section className="delivery-auth-panel">
        <div className="delivery-auth-mobile-head">
          <button type="button" onClick={() => navigate("/login", { replace: true })} aria-label="Voltar ao login"><ArrowLeft /></button>
          <Logo />
        </div>
        <div className="delivery-auth-card">
          <header>
            <span className="delivery-auth-kicker">Redefinir acesso</span>
            <h2>Escolha sua nova senha</h2>
            <p>Preencha os dois campos para confirmar a alteração.</p>
          </header>

          <form className="delivery-auth-form" onSubmit={handleResetPassword}>
            <div>
              <Label htmlFor="reset-password">Nova senha</Label>
              <div className={`delivery-auth-input ${passwordIsValid ? "is-valid" : ""}`}>
                <LockKeyhole />
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Digite uma senha segura"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="delivery-password-rules" aria-live="polite">
              {passwordRules.map((rule) => (
                <span className={rule.valid ? "is-valid" : ""} key={rule.label}>
                  <Check /> {rule.label}
                </span>
              ))}
            </div>

            <div>
              <Label htmlFor="reset-password-confirmation">Confirmar nova senha</Label>
              <div className={`delivery-auth-input ${passwordsMatch ? "is-valid" : ""}`}>
                <LockKeyhole />
                <Input
                  id="reset-password-confirmation"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Digite novamente"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="delivery-auth-submit btn-primary"
              disabled={loading || !token || !passwordIsValid || !passwordsMatch}
            >
              {loading
                ? <><Loader2 className="animate-spin" /> Atualizando...</>
                : <>Alterar minha senha <ChevronRight /></>}
            </Button>
          </form>

          <p className="delivery-auth-terms">
            <Link to="/forgot-password">Solicitar outro link de recuperação</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;
