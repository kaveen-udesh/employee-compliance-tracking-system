export function prettyLabel(value: string) {
  return value.replaceAll('_', ' ');
}

export function dateOnly(value: string) {
  return value.slice(0, 10);
}

export function formatDate(value: string) {
  return new Date(`${dateOnly(value)}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function daysUntil(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateOnly(value)}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function dueLabel(value: string) {
  const days = daysUntil(value);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'due today';
  return `in ${days}d`;
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
