import { Button } from '@/components/ui/button';
import { JobCard } from '../../components/JobCard';
import { useJobs } from '../../hooks/useJobs';

export function Feed() {
  const { jobs, total, page, pageSize, loading, error, goToPage } = useJobs();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Vagas coletadas</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
            {jobs.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma vaga coletada ainda.</p>}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
              Próxima
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
