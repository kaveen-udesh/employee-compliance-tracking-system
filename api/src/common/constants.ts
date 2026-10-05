export const DEPARTMENTS = [
  'engineering',
  'hr',
  'finance',
  'operations',
  'legal',
] as const;

export const COMPLIANCE_TYPES = [
  'visa',
  'certification',
  'background_check',
  'training',
] as const;

export const COMPLIANCE_STATUSES = [
  'active',
  'expiring',
  'expired',
  'renewed',
] as const;

export type Department = (typeof DEPARTMENTS)[number];
export type ComplianceType = (typeof COMPLIANCE_TYPES)[number];
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export const DEFAULT_EXPIRING_SOON_DAYS = 30;
