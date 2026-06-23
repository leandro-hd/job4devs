import { Badge } from '@/components/ui/badge';
import type { AlertLog } from '../services/status.service';
import { formatDate } from '../utils/formatters';

interface StatusBannerProps {
  lastCycle: AlertLog | null;
}

const STATUS_LABEL: Record<AlertLog['status'], string> = {
  success: 'Sucesso',
  partial: 'Parcial',
  failed: 'Falhou',
};

const STATUS_VARIANT: Record<AlertLog['status'], 'default' | 'destructive' | 'secondary'> = {
  success: 'default',
  partial: 'secondary',
  failed: 'destructive',
};

export function StatusBanner({ lastCycle }: StatusBannerProps) {
  if (!lastCycle) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Nenhum ciclo do worker rodou ainda.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Badge variant={STATUS_VARIANT[lastCycle.status]}>{STATUS_LABEL[lastCycle.status]}</Badge>
        <span className="text-sm text-muted-foreground">
          Último ciclo: {formatDate(lastCycle.executedAt)} — {lastCycle.jobsFound} vagas encontradas,{' '}
          {lastCycle.jobsNew} novas, {lastCycle.jobsNotified} notificadas.
        </span>
      </div>
    </div>
  );
}
