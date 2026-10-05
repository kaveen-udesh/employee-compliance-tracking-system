import {
  COMPLIANCE_STATUSES,
  ComplianceStatus,
  DEFAULT_EXPIRING_SOON_DAYS,
} from './constants';

export function toDateOnly(value: Date | string): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addUtcDays(dateOnly: string, days: number): string {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string): Date {
  return new Date(`${toDateOnly(value)}T00:00:00.000Z`);
}

export function computeStatus(
  expiryDate: Date | string,
  today = utcToday(),
  expiringSoonDays = DEFAULT_EXPIRING_SOON_DAYS,
): ComplianceStatus {
  const expiry = toDateOnly(expiryDate);
  if (expiry < today) {
    return 'expired';
  }
  if (expiry <= addUtcDays(today, expiringSoonDays)) {
    return 'expiring';
  }
  return 'active';
}

export function isComplianceStatus(value: string): value is ComplianceStatus {
  return (COMPLIANCE_STATUSES as readonly string[]).includes(value);
}

export function resolveUpdatedStatus(
  issuedDate: Date | string,
  expiryDate: Date | string,
  previousStatus?: string,
  datesChanged = false,
): ComplianceStatus {
  const computed = computeStatus(expiryDate);
  if (
    datesChanged &&
    (previousStatus === 'expired' || previousStatus === 'expiring') &&
    computed !== 'expired'
  ) {
    return computed === 'expiring' ? 'expiring' : 'renewed';
  }
  return computed;
}

export function buildAlertFingerprint(
  recordId: string,
  status: string,
  evaluationDate = utcToday(),
): string {
  return `${recordId}:${status}:${evaluationDate}`;
}
