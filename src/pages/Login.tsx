import { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, Mail, Shield, ShoppingBag, Truck, UserRound, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useEstabelecimento } from '@/hooks/useEstabelecimento';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { configuracao } = useEstabelecimento();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [papel, setPapel] = useState<'cliente' | 'entregador' | 'equipe'>(
    params.get('equipe') === '1' ? 'equipe' : 'cliente',
  );
  const [loading, setLoading] = useState(false);
  const [erroGoogle, setErroGoogle] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [modoEmail, setModoEmail] = useState<'login' | 'cadastro'>('login');
  const [mostrarAcessoEmail, setMostrarAcessoEmail] = useState(false);
  const nome = configuracao?.nome_plataforma || 'Delivery';

  const concluir = () => navigate(
    sessionStorage.getItem('deliveryPostLoginAction') === 'address' ? '/' : '/dashboard-redirect',
    { replace: true },
  );

  const autenticarGoogle = useCallback(async (credential: string) => {
    setLoading(true);
    setErroGoogle('');
    const result = await signInWithGoogle(credential, papel);
    setLoading(false);
    if (!result.success) {
      toast({
        title: result.pendingApproval ? 'Cadastro aguardando aprovação' : 'Não foi possível entrar',
        description: result.error,
        variant: result.pendingApproval ? 'default' : 'destructive',
      });
      return;
    }
    toast({ title: 'Acesso realizado', description: `Bem-vindo(a) ao ${nome}.` });
    concluir();
  }, [nome, papel, signInWithGoogle]);

  const autenticarComEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailNormalizado = email.trim().toLowerCase();
    const modoEfetivo = papel === 'equipe' ? 'login' : modoEmail;
    if (modoEfetivo === 'cadastro' && senha !== confirmarSenha) {
      toast({
        title: 'As senhas não coincidem',
        description: 'Digite a mesma senha nos dois campos.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const result = modoEfetivo === 'login'
      ? await signIn(emailNormalizado, senha, papel)
      : await signUp(emailNormalizado, senha, nomeCompleto.trim(), papel);
    setLoading(false);

    if (!result.success) {
      toast({
        title: modoEfetivo === 'login' ? 'Não foi possível entrar' : 'Não foi possível concluir o cadastro',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }
    if ('pendingApproval' in result && result.pendingApproval) {
      toast({
        title: 'Cadastro aguardando aprovação',
        description: 'A gerência precisa aprovar o acesso de entregador antes do primeiro login.',
      });
      setModoEmail('login');
      setSenha('');
      setConfirmarSenha('');
      return;
    }

    toast({
      title: modoEfetivo === 'login' ? 'Acesso realizado' : 'Cadastro concluído',
      description: `Bem-vindo(a) ao ${nome}.`,
    });
    concluir();
  };

  return (
    <main className="delivery-auth-page">
      <section className="delivery-auth-showcase" aria-label={`Acesso ao ${nome}`}>
        <button type="button" className="delivery-auth-back" onClick={() => navigate('/', { replace: true })}>
          <ArrowLeft /><span>Voltar ao cardápio</span>
        </button>
        <div className="delivery-auth-brand"><Logo /></div>
        <div className="delivery-auth-message">
          <span className="delivery-auth-kicker">Seu pedido, do seu jeito</span>
          <h1>Entre do jeito que preferir.</h1>
          <p>Use sua conta Google ou continue com e-mail e senha. Seus endereços e pedidos permanecem vinculados à sua conta.</p>
        </div>
        <div className="delivery-auth-benefits">
          <span><ShoppingBag /> Pedidos organizados</span><span><Truck /> Acompanhamento fácil</span>
        </div>
      </section>

      <section className="delivery-auth-panel">
        <div className="delivery-auth-mobile-head">
          <button type="button" onClick={() => navigate('/', { replace: true })} aria-label="Voltar ao cardápio"><ArrowLeft /></button>
          <Logo />
        </div>
        <div className="delivery-auth-card">
          <header>
            <span className="delivery-auth-kicker">Área segura</span>
            <h2>Como deseja entrar?</h2>
            <p>Escolha seu perfil e use o Google ou seu e-mail e senha.</p>
          </header>

            <div className="delivery-auth-form">
              <fieldset className="delivery-account-type" disabled={loading}>
                <legend>Selecione seu perfil</legend>
                <button type="button" className={papel === 'cliente' ? 'is-active' : ''} onClick={() => setPapel('cliente')}><UserRound /><span><strong>Cliente</strong><small>Fazer e acompanhar pedidos</small></span></button>
                <button type="button" className={papel === 'entregador' ? 'is-active' : ''} onClick={() => setPapel('entregador')}><Truck /><span><strong>Entregador</strong><small>Acesso sujeito à aprovação da gerência</small></span></button>
                <button type="button" className={papel === 'equipe' ? 'is-active' : ''} onClick={() => { setPapel('equipe'); setModoEmail('login'); }}><UsersRound /><span><strong>Equipe Deliciê</strong><small>Gerência e funcionários autorizados</small></span></button>
              </fieldset>
              {papel === 'equipe' && <div className="delivery-team-google-info"><Shield /><span><strong>Acesso exclusivo da equipe</strong><small>Somente contas autorizadas no dashboard poderão entrar.</small></span></div>}
              <GoogleSignInButton disabled={loading} onCredential={autenticarGoogle} onUnavailable={setErroGoogle} />
              {loading && <p role="status"><Loader2 className="animate-spin" /> Validando sua conta...</p>}
              {erroGoogle && <p role="alert">{erroGoogle}</p>}

              <div className="delivery-auth-divider"><span>ou</span></div>
              <button
                type="button"
                className="delivery-auth-email-toggle"
                aria-expanded={mostrarAcessoEmail}
                onClick={() => setMostrarAcessoEmail(value => !value)}
              >
                <Mail />
                <span>
                  <strong>{mostrarAcessoEmail ? 'Ocultar acesso por e-mail' : papel === 'equipe' ? 'Entrar com e-mail da equipe' : 'Entrar ou cadastrar com e-mail'}</strong>
                  <small>{papel === 'equipe' ? 'Alternativa para a equipe autorizada' : 'Para quem já possui senha ou não usa Google'}</small>
                </span>
              </button>

              {mostrarAcessoEmail && (
                <form className="delivery-auth-form delivery-auth-password-flow" onSubmit={autenticarComEmail}>
                  {papel !== 'equipe' && <div className="delivery-auth-mode" role="group" aria-label="Escolha entrar ou cadastrar">
                    <button type="button" className={modoEmail === 'login' ? 'is-active' : ''} onClick={() => setModoEmail('login')}>Já tenho cadastro</button>
                    <button type="button" className={modoEmail === 'cadastro' ? 'is-active' : ''} onClick={() => setModoEmail('cadastro')}>Criar cadastro</button>
                  </div>}

                  {papel !== 'equipe' && modoEmail === 'cadastro' && <div>
                    <Label htmlFor="customer-name">Nome completo</Label>
                    <div className="delivery-auth-input"><UserRound /><Input id="customer-name" placeholder="Digite seu nome completo" autoComplete="name" value={nomeCompleto} onChange={event => setNomeCompleto(event.target.value)} required minLength={2} maxLength={120} /></div>
                  </div>}

                  <div>
                    <Label htmlFor="customer-email">E-mail</Label>
                    <div className="delivery-auth-input"><Mail /><Input id="customer-email" type="email" placeholder="seuemail@exemplo.com" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></div>
                  </div>

                  <div>
                    <div className="delivery-auth-label-row">
                      <Label htmlFor="customer-password">Senha</Label>
                      {(papel === 'equipe' || modoEmail === 'login') && <Link to="/forgot-password">Recuperar acesso</Link>}
                    </div>
                    <div className="delivery-auth-input"><LockKeyhole /><Input id="customer-password" type={mostrarSenha ? 'text' : 'password'} placeholder="Digite sua senha" autoComplete={papel === 'equipe' || modoEmail === 'login' ? 'current-password' : 'new-password'} value={senha} onChange={event => setSenha(event.target.value)} required minLength={8} maxLength={128} /><button type="button" onClick={() => setMostrarSenha(value => !value)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={mostrarSenha}>{mostrarSenha ? <EyeOff /> : <Eye />}</button></div>
                  </div>

                  {papel !== 'equipe' && modoEmail === 'cadastro' && <>
                    <div>
                      <Label htmlFor="customer-password-confirmation">Confirmar senha</Label>
                      <div className="delivery-auth-input"><LockKeyhole /><Input id="customer-password-confirmation" type={mostrarConfirmacao ? 'text' : 'password'} placeholder="Digite a senha novamente" autoComplete="new-password" value={confirmarSenha} onChange={event => setConfirmarSenha(event.target.value)} required minLength={8} maxLength={128} /><button type="button" onClick={() => setMostrarConfirmacao(value => !value)} aria-label={mostrarConfirmacao ? 'Ocultar confirmação da senha' : 'Mostrar confirmação da senha'} aria-pressed={mostrarConfirmacao}>{mostrarConfirmacao ? <EyeOff /> : <Eye />}</button></div>
                    </div>
                    <p className="delivery-auth-password-hint">Use ao menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo.</p>
                  </>}

                  <Button className="delivery-auth-submit btn-primary" disabled={loading}>
                    {loading ? <><Loader2 className="animate-spin" /> Aguarde...</> : papel === 'equipe' || modoEmail === 'login' ? 'Entrar com e-mail' : 'Criar minha conta'}
                  </Button>
                </form>
              )}

              {papel === 'cliente' && <button type="button" className="delivery-auth-guest" onClick={() => navigate('/')}>Continuar sem conta</button>}
            </div>
          <p className="delivery-auth-terms">Ao continuar, você declara estar de acordo com os termos e a política de privacidade.</p>
        </div>
      </section>
    </main>
  );
}
