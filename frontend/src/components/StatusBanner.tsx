import { Badge } from '@/components/ui/badge';
import type { AlertLog } from '../services/status.service';
import { formatDateTime } from '../utils/formatters';

interface StatusBannerProps {
  lastCycle: AlertLog | null;
}

const STATUS_LABEL: Record<AlertLog['status'], string> = {
  success: 'Sucesso',
  partial: 'Parcial',
  failed: 'Falhou',
};

const STATUS_CLASSNAME: Record<AlertLog['status'], string> = {
  success: 'bg-success text-success-foreground border-transparent',
  partial: 'bg-warning text-warning-foreground border-transparent',
  failed: 'bg-destructive text-white border-transparent',
};

const STATUS_BOX: Record<AlertLog['status'], string> = {
  success: 'border-success/30 bg-success/10',
  partial: 'border-warning/30 bg-warning/10',
  failed: 'border-destructive/30 bg-destructive/10',
};

export function StatusBanner({ lastCycle }: StatusBannerProps) {
  if (!lastCycle) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Nenhum ciclo do worker rodou ainda.
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between rounded-lg border p-4 ${STATUS_BOX[lastCycle.status]}`}>
      <div className="flex items-center gap-3">
        <Badge className={STATUS_CLASSNAME[lastCycle.status]}>{STATUS_LABEL[lastCycle.status]}</Badge>
        <span className="text-sm text-muted-foreground">
          Último ciclo: {formatDateTime(lastCycle.executedAt)} — {lastCycle.jobsFound} vagas encontradas,{' '}
          {lastCycle.jobsNew} novas, {lastCycle.jobsNotified} notificadas.
        </span>
      </div>
    </div>
  );
}
