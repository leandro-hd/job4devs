export function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatBudget(min: number | null, max: number | null, type: string): string {
  if (type !== 'fixed' && type !== 'hourly') {
    return 'A combinar';
  }
  if (min !== null && max !== null) {
    return `R$ ${min} - R$ ${max}`;
  }
  if (min !== null) {
    return `A partir de R$ ${min}`;
  }
  return 'A combinar';
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
