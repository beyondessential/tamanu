import { Page, Locator, expect } from '@playwright/test';
import { STYLED_TABLE_CELL_PREFIX } from '../../../../utils/testIds';

export class LabRequestPane {
  readonly page: Page;
  readonly newLabRequestButton: Locator;
  
  // Table locators
  readonly labRequestTable: Locator;
  readonly tableBody: Locator;
  
  // Table row and cell locators
  readonly tableRows: Locator;
  readonly categoryHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newLabRequestButton = page.getByTestId('component-enxe').getByText('New Lab Request');
    
    // Table locators
    this.labRequestTable = page.getByTestId('styledtable-1dlu');
    this.tableBody = page.getByTestId('styledtablebody-a0jz');
    
    // Table row and cell locators
    this.tableRows = this.tableBody.locator('tr');
    this.categoryHeader = page.getByTestId('tablesortlabel-0qxx-category.name');
  }
  
  // Helper methods to get specific cells
  getTestIdCell(rowIndex: number): Locator {
    return this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${rowIndex}-requestId`);
  }
  
  getTestCategoryCell(rowIndex: number): Locator {
    return this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${rowIndex}-category.name`);
  }
  
  getRequestedDateCell(rowIndex: number): Locator {
    return this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${rowIndex}-requestedDate`);
  }
  
  getRequestedByCell(rowIndex: number): Locator {
    return this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${rowIndex}-displayName`);
  }
  
  getPriorityCell(rowIndex: number): Locator {
    return this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${rowIndex}-priority.name`);
  }
  
  getStatusCell(rowIndex: number): Locator {
    return this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${rowIndex}-status`);
  }
  
  async validateLabRequestTableContent(
    panelCategories: string[],
    requestedDate: string,
    requestedBy: string,
    priority: string,
    status: string,
  ) {
    // Wait for table to be visible
    await this.labRequestTable.waitFor({ state: 'visible' });
    
    // Sort panel categories alphabetically
    const sortedPanelCategories = [...panelCategories].sort();
    
    // Validate each lab request row
    for (let i = 0; i < sortedPanelCategories.length; i++) {
      // Validate test category
      const categoryCell = this.getTestCategoryCell(i);
      await expect(categoryCell).toHaveText(sortedPanelCategories[i]);
      
      // Validate requested date
      const dateCell = this.getRequestedDateCell(i);
      const actualDate = await dateCell.textContent();
      // Convert ISO date format to MM/DD/YYYY format for comparison
      const date = new Date(requestedDate);
      const expectedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      await expect(actualDate).toBe(expectedDate);
      
      // Validate requested by
      const requesterCell = this.getRequestedByCell(i);
      await expect(requesterCell).toHaveText(requestedBy);
      
      // Validate priority
      const priorityCell = this.getPriorityCell(i);
      await expect(priorityCell).toHaveText(priority);
      
      // Validate status
      const statusCell = this.getStatusCell(i);
      await expect(statusCell).toHaveText(status);
    }
  }

  async sortTableByCategory() {
    // Click on the category column header to sort by category alphabetically
    for (let i = 0; i < 2; i++) {
      await this.categoryHeader.click();
      
    }
    
  }

  async waitForTableToLoad() {
    // Wait for the lab request table to be visible and loaded
    await this.labRequestTable.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
} 