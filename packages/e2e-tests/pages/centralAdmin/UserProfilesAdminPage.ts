import { Locator, Page } from '@playwright/test';

import { searchAndSelectAutocompleteOption } from '../../utils/fieldHelpers';
import { constructAdminUrl } from '../../utils/navigation';
import { STYLED_TABLE_CELL_PREFIX } from '../../utils/testHelper';

export interface UserSearchCriteria {
  displayName?: string;
  facility?: string;
}

/** The admin panel's User profiles view: a user search above the table of users */
export class UserProfilesAdminPage {
  readonly page: Page;
  readonly displayNameInput: Locator;
  readonly advancedSearchButton: Locator;
  readonly facilityInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.displayNameInput = page.getByTestId('field-displayname-search-input');
    this.advancedSearchButton = page.getByTestId('iconbutton-zrkv');
    this.facilityInput = page.getByTestId('field-facility-search-input');
    this.searchButton = page.getByTestId('searchbutton-nt24');
  }

  async goto() {
    await this.page.goto(constructAdminUrl('/admin/users/profiles'));
  }

  /** Searches for users, opening advanced search when a facility is given */
  async searchUsers({ displayName, facility }: UserSearchCriteria) {
    if (displayName) {
      await this.displayNameInput.fill(displayName);
    }
    if (facility) {
      await this.advancedSearchButton.click();
      await searchAndSelectAutocompleteOption(this.page, this.facilityInput, facility);
    }
    await this.searchButton.click();
  }

  /** A cell of the user table, by row and by the key of its column */
  userTableCell(rowIndex: number, columnKey: string): Locator {
    return this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${rowIndex}-${columnKey}`);
  }
}
