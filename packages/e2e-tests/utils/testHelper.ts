import { Page } from '@playwright/test';

import { SidebarPage } from '../pages/SidebarPage';

export async function getSidebarFacilityDisplayName(page: Page): Promise<string> {
  const sidebar = new SidebarPage(page);
  return sidebar.getFacilityName();
}
