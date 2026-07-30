import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthLayout } from '../../components/AuthLayout';
import * as authService from '../../services/auth.service';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch {
      setError('Não foi possível processar sua solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <AuthLayout>
        <Card className="w-full border-t-4 border-t-violet-500 shadow-lg">
          <CardHeader>
            <CardTitle>Verifique seu e-mail</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em breve.
            </p>
            <Link to="/login" className="text-sm font-medium text-violet-600 hover:underline">
              Voltar para o login
            </Link>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full border-t-4 border-t-violet-500 shadow-lg">
        <CardHeader>
          <CardTitle>Redefinir senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700">
              {loading ? 'Enviando...' : 'Enviar link de redefinição'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-violet-600 hover:underline">
                Voltar para o login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
