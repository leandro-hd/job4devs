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
      {status?.freelas99AuthExpired && (
        <div className="rounded-md border border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-600 dark:bg-yellow-950 dark:text-yellow-200">
          <strong>Credenciais do 99freelas expiraram.</strong> Os campos de média de propostas ficam nulos até a atualização. Acesse Railway → Backend → Variables e atualize <code>FREELAS99_AUTH_ID</code> e <code>FREELAS99_AUTH_TOKEN</code>.
        </div>
      )}
      <StatusBanner lastCycle={status?.lastCycle ?? null} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="overflow-hidden border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total de vagas coletadas</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-violet-600">{status?.totalJobs ?? 0}</CardContent>
        </Card>
        <Card className="overflow-hidden border-l-4 border-l-cyan-500">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Notificações enviadas</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-cyan-600">{status?.totalNotificationsSent ?? 0}</CardContent>
        </Card>
      </div>
    </div>
  );
}
