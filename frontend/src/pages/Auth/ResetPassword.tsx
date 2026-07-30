import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthLayout } from '../../components/AuthLayout';
import * as authService from '../../services/auth.service';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <AuthLayout>
        <Card className="w-full border-t-4 border-t-violet-500 shadow-lg">
          <CardContent className="pt-6">
            <p className="mb-4 text-sm text-destructive">Link de redefinição inválido ou expirado.</p>
            <Link to="/forgot-password" className="text-sm font-medium text-violet-600 hover:underline">
              Solicitar um novo link
            </Link>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      void navigate('/login?reset=true');
    } catch {
      setError('Link inválido ou expirado. Solicite um novo link de redefinição.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full border-t-4 border-t-violet-500 shadow-lg">
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700">
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
