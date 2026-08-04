import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthLayout } from '../../components/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import * as authService from '../../services/auth.service';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setVerifying(true);
      authService
        .verifyEmail(token)
        .then(() => setVerified(true))
        .catch(() => setVerifyError(true))
        .finally(() => setVerifying(false));
    } else if (!user) {
      navigate('/login', { replace: true });
    }
  }, [token, user, navigate]);

  useEffect(() => {
    if (verified) {
      const timer = setTimeout(() => navigate('/login?verified=true'), 2500);
      return () => clearTimeout(timer);
    }
  }, [verified, navigate]);

  async function handleResend(): Promise<void> {
    setResending(true);
    setResendError(null);
    try {
      await authService.resendVerification();
      setResent(true);
    } catch {
      setResendError('Não foi possível reenviar o e-mail. Tente novamente.');
    } finally {
      setResending(false);
    }
  }

  if (token) {
    if (verifying) {
      return (
        <AuthLayout>
          <Card className="w-full border-t-4 border-t-violet-500 shadow-lg">
            <CardHeader>
              <CardTitle>Verificando...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Aguarde enquanto confirmamos seu e-mail.</p>
            </CardContent>
          </Card>
        </AuthLayout>
      );
    }

    if (verified) {
      return (
        <AuthLayout>
          <Card className="w-full border-t-4 border-t-green-500 shadow-lg">
            <CardHeader>
              <CardTitle>E-mail confirmado!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sua conta está ativa. Redirecionando para o login...
              </p>
            </CardContent>
          </Card>
        </AuthLayout>
      );
    }

    if (verifyError) {
      return (
        <AuthLayout>
          <Card className="w-full border-t-4 border-t-destructive shadow-lg">
            <CardHeader>
              <CardTitle>Link inválido</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Este link de verificação é inválido ou já foi utilizado.
              </p>
              <Link to="/login" className="text-sm font-medium text-violet-600 hover:underline">
                Ir para o login
              </Link>
            </CardContent>
          </Card>
        </AuthLayout>
      );
    }

    return null;
  }

  return (
    <AuthLayout>
      <Card className="w-full border-t-4 border-t-violet-500 shadow-lg">
        <CardHeader>
          <CardTitle>Confirme seu e-mail</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Enviamos um link de verificação para <strong>{user?.email}</strong>. Clique no link
            para ativar sua conta.
          </p>
          {resent && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              E-mail reenviado! Verifique sua caixa de entrada.
            </p>
          )}
          {resendError && <p className="text-sm text-destructive">{resendError}</p>}
          <Button variant="outline" onClick={handleResend} disabled={resending || resent}>
            {resending ? 'Enviando...' : resent ? 'E-mail enviado' : 'Reenviar e-mail'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-violet-600 hover:underline">
              Usar outra conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
