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

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  department: Department;
  createdAt?: string;
  _count?: { records: number };
}

export interface ComplianceRecord {
  id: string;
  employeeId: string;
  employee: Employee;
  type: ComplianceType;
  issuedDate: string;
  expiryDate: string;
  status: ComplianceStatus;
  notes?: string | null;
  documentUrl?: string | null;
  archivedAt?: string | null;
  lastAlertFingerprint?: string | null;
}

export interface StatusBreakdown {
  active: number;
  expiring: number;
  expired: number;
  renewed: number;
  total: number;
}

export interface DashboardReport {
  generatedAt: string;
  strategy: string;
  window: { from: string; to: string; days: number | null };
  totals: StatusBreakdown & { archived: number };
  byDepartment: Array<StatusBreakdown & { department: string }>;
  byType: Array<StatusBreakdown & { type: string }>;
  expiringSoon: ComplianceRecord[];
}
