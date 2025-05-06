import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./basePages/BasePage";

export class AllPatientPage extends BasePage {
  readonly NHNTxt: Locator;
  readonly firstNameTxt: Locator;
  readonly lastNameTxt: Locator;
  readonly DOBTxt: Locator;
  readonly CulturalNameTxt: Locator;
  readonly DOBFromTxt: Locator;
  readonly DOBToTxt: Locator;
  readonly sexDd: Locator;
  readonly villageSearchBox: Locator;
  readonly includeDeceasedChk: Locator;
  readonly advanceSearchIcon: Locator;
  readonly searchBtn: Locator;
  readonly tableRows: Locator;
  readonly addNewPatientbtn: Locator;
  readonly NewPatientFirstNametxt: Locator;
  readonly NewPatientLastName: Locator;
  readonly NewPatientDOBtxt: Locator;
  readonly NewPatientMaleChk: Locator;
  readonly NewPatientFemaleChk: Locator;
  readonly NewPatientNHN: Locator;
  readonly NewPatientConirmBtn: Locator;
  readonly admitBtn: Locator;
  readonly hospitalAdmissionbtn: Locator;

  constructor(page: Page) {
    super(page);
    this.NHNTxt = page.getByPlaceholder("NHN");
    this.firstNameTxt = page.getByRole("textbox", { name: "First name" });
    this.lastNameTxt = page.getByRole("textbox", { name: "Last name" });
    this.DOBTxt = page.locator('input[type="date"]').getByLabel("DOB");
    this.CulturalNameTxt = page.getByRole("textbox", { name: "Cultural name" });
    this.DOBFromTxt = page.getByLabel("DOB from");
    this.DOBToTxt = page.getByLabel("DOB to");
    this.sexDd = page.locator("div").getByLabel("Sex");
    this.villageSearchBox = page.locator("div").getByLabel("Village");
    this.includeDeceasedChk = page.locator('input[name="deceased"]');
    this.advanceSearchIcon = page.getByRole("button", {
      name: "show advanced search",
    });
    this.searchBtn = page.getByRole("button", { name: "Search", exact: true });
    this.tableRows = page.locator("tbody tr");
    this.addNewPatientbtn = page.getByText("Add new patient");
    this.admitBtn = this.page.locator("text=Admit or check-in");
    this.hospitalAdmissionbtn = this.page.locator("text=Hospital admission");

    this.NewPatientFirstNametxt = page
      .getByRole("dialog")
      .locator('input[name="firstName"]');
    this.NewPatientLastName = page
      .getByRole("dialog")
      .locator('input[name="lastName"]');
    this.NewPatientDOBtxt = page
      .getByRole("dialog")
      .locator('input[type="date"]');
    this.NewPatientMaleChk = page
      .getByLabel("sex")
      .getByText("Male", { exact: true });
    this.NewPatientFemaleChk = page
      .getByLabel("sex")
      .getByText("Female", { exact: true });
    this.NewPatientNHN = page.locator('[data-test-class="id-field-div"]');
    this.NewPatientConirmBtn = page.getByText("Confirm");
  }
  //Generic method to search with different field combinations
  async searchTable(searchCriteria: {
    NHN?: string;
    firstName?: string;
    lastName?: string;
    DOB?: string;
    culturalName?: string;
    DOBFrom?: string;
    DOBTo?: string;
    sex?: string;
    village?: string;
  }) {
    // Fill search fields if provided
    if (searchCriteria.NHN) {
      await this.NHNTxt.fill(searchCriteria.NHN);
    }
    if (searchCriteria.firstName) {
      await this.firstNameTxt.fill(searchCriteria.firstName);
    }
    if (searchCriteria.lastName) {
      await this.firstNameTxt.fill(searchCriteria.lastName);
    }
    if (searchCriteria.DOB) {
      await this.DOBTxt.fill(searchCriteria.DOB);
    }
    if (searchCriteria.culturalName) {
      await this.CulturalNameTxt.fill(searchCriteria.culturalName);
    }
    if (searchCriteria.DOBFrom) {
      await this.DOBFromTxt.fill(searchCriteria.DOBFrom);
    }
    if (searchCriteria.DOBTo) {
      await this.DOBToTxt.fill(searchCriteria.DOBTo);
    }
    //need to write a method to select static drop downs
    if (searchCriteria.sex) {
      await this.sexDd.fill(searchCriteria.sex);
    }
    //need to write a method to select from search fields
    if (searchCriteria.village) {
      await this.villageSearchBox.fill(searchCriteria.village);
    }
    await this.page.waitForTimeout(1000);
    await this.searchBtn.click();
  }

  async clickOnFirstRow() {
    await this.tableRows.nth(0).click();
  }
  // Validate that at least one row is displayed after search
  async validateSearchResults() {
    const rowCount = await this.tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  }

  // Validate that a specific row appears
  async validateRowContainsText(expectedText: string) {
    const rowLocator = this.tableRows.filter({ hasText: expectedText }).nth(0);
    await expect(rowLocator).toBeVisible();
  }
  //Validate that no results are found
  async validateNoResults() {
    await expect(this.tableRows).toHaveCount(0);
  }

  // Method to fill new patient details
  async fillNewPatientDetails(
    firstName: string,
    lastName: string,
    dob: string,
    gender: string,
  ) {
    await this.NewPatientFirstNametxt.fill(firstName);
    await this.NewPatientLastName.fill(lastName);

    await this.NewPatientDOBtxt.click();
    await this.NewPatientDOBtxt.fill(dob);
    console.log(`DOB: ${dob}`);
    if (gender === "female") {
      await this.NewPatientFemaleChk.check();
    } else {
      await this.NewPatientMaleChk.check();
    }
  }
 

  async hasSearchResults(): Promise<boolean> {
    const rowCount = await this.tableRows.count();
    return rowCount > 0;
  }

  async clickFirstSearchResult() {
    if (await this.hasSearchResults()) {
      await this.page.locator("table tbody tr").first().click();
    } else {
      throw new Error("No search results found in table");
    }
  }
}
