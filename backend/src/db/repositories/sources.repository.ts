import { pool } from '../index';

export interface Source {
  id: number;
  name: string;
  baseUrl: string;
  active: boolean;
}

interface SourceRow {
  id: number;
  name: string;
  base_url: string;
  active: boolean;
}

function mapRow(row: SourceRow): Source {
  return {
    id: row.id,
    name: row.name,
    baseUrl: row.base_url,
    active: row.active,
  };
}

export async function findByName(name: string): Promise<Source | null> {
  const result = await pool.query<SourceRow>(
    `SELECT id, name, base_url, active FROM sources WHERE name = $1`,
    [name]
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}
