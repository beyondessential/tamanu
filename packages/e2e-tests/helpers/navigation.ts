import { Page } from '@playwright/test';
import 'dotenv/config';

export const FACILITY_URL = process.env.FACILITY_FRONTEND_URL ?? 'http://localhost:5173';
export const ADMIN_URL = process.env.ADMIN_FRONTEND_URL ?? 'http://localhost:5174';

export function facilityUrl(path: string): string {
  return `${FACILITY_URL}${path}`;
}

export function adminUrl(path: string): string {
  return `${ADMIN_URL}${path}`;
}

export async function goToFacility(page: Page): Promise<void> {
  await page.goto(FACILITY_URL);
}

export async function goToAdmin(page: Page): Promise<void> {
  await page.goto(ADMIN_URL);
}

export const routes = {
  login: '/',
  dashboard: '/dashboard',
  patients: {
    all: '/patients/all',
    inpatients: '/patients/inpatient',
    outpatients: '/patients/outpatient',
  },
} as const;
