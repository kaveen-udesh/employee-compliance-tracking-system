import { env } from '$env/dynamic/public';
import type {
  ComplianceRecord,
  DashboardReport,
  Employee,
} from './types';

const baseUrl = env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export const API_BASE_URL = baseUrl;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const body = await response.json();
      message = body.message?.toString() ?? JSON.stringify(body);
    } catch {
      // keep the status message
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  dashboard(params: URLSearchParams) {
    return request<DashboardReport>(`/reports/dashboard?${params.toString()}`);
  },
  employees(params?: URLSearchParams) {
    const query = params?.toString();
    return request<Employee[]>(`/employees${query ? `?${query}` : ''}`);
  },
  createEmployee(payload: Pick<Employee, 'fullName' | 'email' | 'department'>) {
    return request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  records(params: URLSearchParams) {
    return request<ComplianceRecord[]>(`/compliance-records?${params.toString()}`);
  },
  record(id: string) {
    return request<ComplianceRecord>(`/compliance-records/${id}`);
  },
  createRecord(payload: Record<string, unknown>) {
    return request<ComplianceRecord>('/compliance-records', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateRecord(id: string, payload: Record<string, unknown>) {
    return request<ComplianceRecord>(`/compliance-records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  archiveRecord(id: string, hard = false) {
    return request<ComplianceRecord>(
      `/compliance-records/${id}${hard ? '?hard=true' : ''}`,
      { method: 'DELETE' },
    );
  },
};
