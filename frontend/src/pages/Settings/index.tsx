import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '../../hooks/useSettings';

export function Settings() {
  const { settings, loading, saving, error, save } = useSettings();
  const [keywords, setKeywords] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKeywords(settings.keywords ?? '');
    setMinBudget(settings.min_budget ?? '');
    setNotificationEmail(settings.notification_email ?? '');
  }, [settings]);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSaved(false);
    const ok = await save({
      keywords,
      min_budget: minBudget,
      notification_email: notificationEmail,
    });
    setSaved(ok);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Configurações</h1>
      <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
          <Input id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="min_budget">Orçamento mínimo</Label>
          <Input id="min_budget" type="number" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Ainda não é usado para filtrar vagas — o 99freelas não expõe orçamento na listagem.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="notification_email">E-mail de notificação</Label>
          <Input
            id="notification_email"
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-green-600">Configurações salvas.</p>}
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </div>
  );
}
