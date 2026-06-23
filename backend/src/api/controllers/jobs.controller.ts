import { Request, Response } from 'express';
import * as jobsRepository from '../../db/repositories/jobs.repository';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function listJobs(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT));

  const { jobs, total } = await jobsRepository.findPaginated(page, limit);

  res.json({ jobs, total, page, limit });
}
