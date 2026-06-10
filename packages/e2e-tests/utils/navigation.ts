import { Page } from '@playwright/test';
import 'dotenv/config';

export const facilityFrontend = process.env.FACILITY_FRONTEND_URL ?? 'http://localhost:5173';
export const adminFrontend = process.env.ADMIN_FRONTEND_URL ?? 'http://localhost:5174';

export const goToFacilityFrontend = async (page: Page) => {
  await page.goto(facilityFrontend);
};

export const goToAdminFrontend = async (page: Page) => {
  await page.goto(adminFrontend);
};

export const constructFacilityUrl = (url: string) => {
  return `${facilityFrontend}${url}`;
};

export const constructAdminUrl = (url: string) => {
  return `${adminFrontend}${url}`;
};
