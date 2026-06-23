import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { JobListItem } from '../services/jobs.service';
import { formatBudget, formatDate, truncate } from '../utils/formatters';

interface JobCardProps {
  job: JobListItem;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            <a href={job.url} target="_blank" rel="noreferrer" className="hover:underline">
              {job.title}
            </a>
          </CardTitle>
          <Badge variant="secondary">{job.sourceName}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        {job.description && <p>{truncate(job.description, 180)}</p>}
        <div className="flex items-center justify-between">
          <span>{formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}</span>
          <span>{formatDate(job.publishedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
