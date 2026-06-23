import { useCallback, useEffect, useState } from 'react';
import * as settingsService from '../services/settings.service';
import type { Settings } from '../services/settings.service';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsService
      .getSettings()
      .then(setSettings)
      .catch(() => setError('Não foi possível carregar as configurações.'))
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (updates: Partial<Settings>) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await settingsService.updateSettings(updates);
      setSettings(updated);
      return true;
    } catch {
      setError('Não foi possível salvar as configurações.');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, error, save };
}
