import { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, LockKeyhole, Mail, ShoppingBag, Truck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useEstabelecimento } from '@/hooks/useEstabelecimento';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const { configuracao } = useEstabelecimento();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const equipe = params.get('equipe') === '1';
  const [papel, setPapel] = useState<'cliente' | 'entregador'>('cliente');
  const [loading, setLoading] = useState(false);
  const [erroGoogle, setErroGoogle] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
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
        title: result.pendingApproval ? 'Cadastro aguardando aprovaÃ§Ã£o' : 'NÃ£o foi possÃ­vel entrar',
        description: result.error,
        variant: result.pendingApproval ? 'default' : 'destructive',
      });
      return;
    }
    toast({ title: 'Acesso realizado', description: `Bem-vindo(a) ao ${nome}.` });
    concluir();
  }, [nome, papel, signInWithGoogle]);

  const autenticarEquipe = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const result = await signIn(email.trim().toLowerCase(), senha);
    setLoading(false);
    if (!result.success) {
      toast({ title: 'NÃ£o foi possÃ­vel entrar', description: result.error, variant: 'destructive' });
      return;
    }
    concluir();
  };

  return (
    <main className="delivery-auth-page">
      <section className="delivery-auth-showcase" aria-label={`Acesso ao ${nome}`}>
        <button type="button" className="delivery-auth-back" onClick={() => navigate('/', { replace: true })}>
          <ArrowLeft /><span>Voltar ao cardÃ¡pio</span>
        </button>
        <div className="delivery-auth-brand"><Logo /></div>
        <div className="delivery-auth-message">
          <span className="delivery-auth-kicker">Seu pedido, do seu jeito</span>
          <h1>Entre com sua conta Google.</h1>
          <p>Sem cadastro e sem senha para decorar. Seus endereÃ§os e pedidos continuam protegidos.</p>
        </div>
        <div className="delivery-auth-benefits">
          <span><ShoppingBag /> Pedidos organizados</span><span><Truck /> Acompanhamento fÃ¡cil</span>
        </div>
      </section>

      <section className="delivery-auth-panel">
        <div className="delivery-auth-mobile-head">
          <button type="button" onClick={() => navigate('/', { replace: true })} aria-label="Voltar ao cardÃ¡pio"><ArrowLeft /></button>
          <Logo />
        </div>
        <div className="delivery-auth-card">
          <header>
            <span className="delivery-auth-kicker">Ãrea segura</span>
            <h2>{equipe ? 'Acesso da equipe' : 'Como deseja entrar?'}</h2>
            <p>{equipe ? 'Acesso reservado a gerente e funcionÃ¡rios.' : 'Escolha o perfil e continue com o Google.'}</p>
          </header>

          {equipe ? (
            <form className="delivery-auth-form" onSubmit={autenticarEquipe}>
              <div><Label htmlFor="team-email">E-mail</Label><div className="delivery-auth-input"><Mail /><Input id="team-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></div>
              <div><div className="delivery-auth-label-row"><Label htmlFor="team-password">Senha</Label><Link to="/forgot-password">Recuperar acesso</Link></div><div className="delivery-auth-input"><LockKeyhole /><Input id="team-password" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></div></div>
              <Button className="delivery-auth-submit btn-primary" disabled={loading}>{loading ? <><Loader2 className="animate-spin" /> Entrando...</> : 'Entrar'}</Button>
              <Link className="delivery-auth-guest" to="/login">Voltar ao acesso com Google</Link>
            </form>
          ) : (
            <div className="delivery-auth-form">
              <fieldset className="delivery-account-type" disabled={loading}>
                <legend>Selecione seu perfil</legend>
                <button type="button" className={papel === 'cliente' ? 'is-active' : ''} onClick={() => setPapel('cliente')}><UserRound /><span><strong>Cliente</strong><small>Fazer e acompanhar pedidos</small></span></button>
                <button type="button" className={papel === 'entregador' ? 'is-active' : ''} onClick={() => setPapel('entregador')}><Truck /><span><strong>Entregador</strong><small>Acesso sujeito Ã  aprovaÃ§Ã£o da gerÃªncia</small></span></button>
              </fieldset>
              <GoogleSignInButton disabled={loading} onCredential={autenticarGoogle} onUnavailable={setErroGoogle} />
              {loading && <p role="status"><Loader2 className="animate-spin" /> Validando sua conta...</p>}
              {erroGoogle && <p role="alert">{erroGoogle}</p>}
              <button type="button" className="delivery-auth-guest" onClick={() => navigate('/')}>Continuar sem conta</button>
              <Link className="delivery-auth-guest" to="/login?equipe=1">Acesso da equipe</Link>
            </div>
          )}
          <p className="delivery-auth-terms">Ao continuar, vocÃª declara estar de acordo com os termos e a polÃ­tica de privacidade.</p>
        </div>
      </section>
    </main>
  );
}
