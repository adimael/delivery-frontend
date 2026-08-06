import { FormEvent, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface EnablePasswordCardProps {
  possuiSenha?: boolean;
  onEnabled?: () => void;
}

export const EnablePasswordCard = ({ possuiSenha, onEnabled }: EnablePasswordCardProps) => {
  const { enablePassword } = useAuth();
  const { toast } = useToast();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (possuiSenha !== false) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (senha !== confirmacao) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    const result = await enablePassword(senha, confirmacao);
    setSalvando(false);
    if (!result.success) {
      toast({
        title: 'Não foi possível habilitar a senha',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }
    setSenha('');
    setConfirmacao('');
    onEnabled?.();
    toast({
      title: 'Login por senha habilitado',
      description: 'Agora você pode entrar com esta conta Google ou com seu e-mail e senha.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Habilitar login com e-mail e senha
        </CardTitle>
        <CardDescription>
          Crie uma senha para usar como alternativa ao acesso com o Google.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="habilitar-senha">Nova senha</Label>
            <Input
              id="habilitar-senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use ao menos 8 caracteres, com maiúscula, minúscula, número e símbolo.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar-habilitar-senha">Confirmar senha</Label>
            <Input
              id="confirmar-habilitar-senha"
              type="password"
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </div>
          <Button type="submit" disabled={salvando} className="w-full sm:w-auto">
            {salvando ? 'Habilitando...' : 'Habilitar login por senha'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
