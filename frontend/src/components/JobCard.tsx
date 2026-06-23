import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { JobListItem } from '../services/jobs.service';
import { formatBudget, formatDate, truncate } from '../utils/formatters';

interface JobCardProps {
  job: JobListItem;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Card className="border-l-4 border-l-violet-500 transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            <a href={job.url} target="_blank" rel="noreferrer" className="hover:text-violet-600 hover:underline">
              {job.title}
            </a>
          </CardTitle>
          <Badge className="border-transparent bg-accent text-accent-foreground">{job.sourceName}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        {job.description && <p>{truncate(job.description, 180)}</p>}
        <div className="flex items-center justify-between">
          <span className="font-medium text-violet-600">
            {formatBudget(job.budgetMin, job.budgetMax, job.budgetType)}
          </span>
          <span>{formatDate(job.publishedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
