import { Page } from '@playwright/test';

export const getItemFromLocalStorage = async (page: Page, key: string) => {
  const context = await page.context();
  const storageState = await context.storageState();
  const facilityFrontendUrl = process.env.FACILITY_FRONTEND_URL ?? 'http://localhost:5173';
  const preferredOrigin = new URL(facilityFrontendUrl).origin;

  // Prefer the facility frontend origin; CI can include multiple origins in varying order.
  const originStates = storageState.origins ?? [];
  const matchingOrigin = originStates.find((originState) => originState.origin === preferredOrigin);
  const candidateOrigins = matchingOrigin ? [matchingOrigin, ...originStates] : originStates;

  const response = candidateOrigins
    .flatMap((originState) => originState.localStorage)
    .find((item) => item.name === key)?.value;

  if (!response) {
    throw new Error(`No ${key} found in localStorage`);
  }

  return response;
};
