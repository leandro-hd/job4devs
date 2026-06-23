import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBanner } from '../../components/StatusBanner';
import { useSystemStatus } from '../../hooks/useSystemStatus';

export function Dashboard() {
  const { status, loading } = useSystemStatus();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <StatusBanner lastCycle={status?.lastCycle ?? null} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total de vagas coletadas</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{status?.totalJobs ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Notificações enviadas</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{status?.totalNotificationsSent ?? 0}</CardContent>
        </Card>
      </div>
    </div>
  );
}
