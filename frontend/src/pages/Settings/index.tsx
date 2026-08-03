import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings, type Settings as SettingsData } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import * as authService from '../../services/auth.service';

interface SettingsFormProps {
  initial: SettingsData;
  saving: boolean;
  error: string | null;
  save: (data: Partial<SettingsData>) => Promise<boolean>;
}

function SettingsForm({ initial, saving, error, save }: SettingsFormProps) {
  const [keywords, setKeywords] = useState(initial.keywords ?? '');
  const [excludeKeywords, setExcludeKeywords] = useState(initial.exclude_keywords ?? '');
  const [minBudget, setMinBudget] = useState(initial.min_budget ?? '');
  const [notificationEmail, setNotificationEmail] = useState(initial.notification_email ?? '');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSaved(false);
    const ok = await save({
      keywords,
      exclude_keywords: excludeKeywords,
      min_budget: minBudget,
      notification_email: notificationEmail,
    });
    setSaved(ok);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
        <Input id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="exclude_keywords">Palavras excluídas (separadas por vírgula)</Label>
        <Input
          id="exclude_keywords"
          value={excludeKeywords}
          onChange={(e) => setExcludeKeywords(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Vagas que contenham estas palavras não serão notificadas, mesmo que batam com as palavras-chave.
        </p>
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
  );
}

export function Settings() {
  const { settings, loading, saving, error, save } = useSettings();
  const { user, refreshUser } = useAuth();
  const [reactivating, setReactivating] = useState(false);

  async function handleReactivate(): Promise<void> {
    setReactivating(true);
    try {
      await authService.reactivate();
      await refreshUser();
    } finally {
      setReactivating(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Configurações</h1>
      {user?.active === false && (
        <div className="flex items-center justify-between rounded-md border border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-600 dark:bg-yellow-950 dark:text-yellow-200">
          <span>Seus alertas estão desativados. Você não receberá novas notificações.</span>
          <Button variant="outline" size="sm" onClick={handleReactivate} disabled={reactivating} className="ml-4 shrink-0">
            {reactivating ? 'Reativando...' : 'Reativar alertas'}
          </Button>
        </div>
      )}
      <SettingsForm initial={settings} saving={saving} error={error} save={save} />
    </div>
  );
}
