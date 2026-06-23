import { useEffect, useState } from 'react';
import * as statusService from '../services/status.service';
import type { SystemStatus } from '../services/status.service';

const POLL_INTERVAL_MS = 30_000;

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async (): Promise<void> => {
      try {
        const data = await statusService.getStatus();
        if (!cancelled) {
          setStatus(data);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { status, loading };
}
