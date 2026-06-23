import { Button } from '@/components/ui/button';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <span className="text-sm text-muted-foreground">Olá, {user?.name}</span>
      <Button variant="destructive" size="sm" onClick={logout}>
        Sair
      </Button>
    </header>
  );
}
