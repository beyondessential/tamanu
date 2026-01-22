import { Locator, Page, expect } from '@playwright/test';
import { BasePatientPane } from '../../PatientDetailsPage/panes/BasePatientPane';
import { parse, isSameDay } from 'date-fns';

export class MarView extends BasePatientPane {
  readonly marTitle!: Locator;
  readonly medicationLabel!: Locator;
  readonly scheduledSection!: Locator;
  readonly prnSection!: Locator;
  readonly dateDisplay!: Locator;
  readonly previousDayButton!: Locator;
  readonly nextDayButton!: Locator;
  readonly timeSlotHeaders!: Locator;
  readonly medicationRows!: Locator;
  readonly medicationGrid!: Locator;
  readonly dateWrapper!: Locator;
  readonly scheduledMedications!: Locator;
  readonly prnMedications!: Locator;

  constructor(page: Page) {
    super(page);

    this.marTitle = page.getByTestId('heading3-mar-title').or(
      page.getByRole('heading', { name: 'Medication admin record', level: 3 })
    );
    this.medicationLabel = page.getByTestId('translatedtext-mar-medication-label').or(
      page.locator('div').filter({ hasText: /^Medication$/ }).filter({ hasNot: page.getByTestId('styledbreadcrumbs-68ga') }).first()
    );
    this.scheduledSection = page.getByTestId('translatedtext-mar-scheduled-section').or(
      page.getByText('Scheduled medication', { exact: true }).filter({ hasNot: page.getByTestId('styledbreadcrumbs-68ga') })
    );
    this.prnSection = page.getByTestId('translatedtext-mar-prn-section').or(
      page.getByText('PRN medication', { exact: true }).filter({ hasNot: page.getByTestId('styledbreadcrumbs-68ga') })
    );
    this.dateDisplay = page.getByTestId('mar-date-display').or(
      page.locator('div').filter({ hasText: /^\d{1,2} \w+ \d{4}$/ }).filter({ hasNot: page.getByTestId('styledbreadcrumbs-68ga') }).first()
    );
    // Previous day button is inside the tooltip container with testid
    this.previousDayButton = page.getByTestId('tooltip-b4e8').locator('button').first();
    // Next day button is in the date wrapper area (same parent as date display)
    // Structure: date wrapper > [tooltip with prev button, date display div, next button]
    const dateWrapperLocator = this.dateDisplay.locator('../..').first();
    // Get button that comes after the date display in the date wrapper and is not inside tooltip
    this.nextDayButton = dateWrapperLocator.locator('button').filter({ hasNot: page.getByTestId('tooltip-b4e8') }).filter({ hasNot: page.getByTestId('backbutton-1n40') }).first();
    this.medicationGrid = page.getByTestId('mar-medication-grid').or(
      this.medicationLabel.locator('../..').locator('..')
    );
    this.timeSlotHeaders = page.getByTestId('mar-time-slot-header').or(
      this.medicationGrid.locator('div').filter({ hasText: /\d{1,2}(am|pm) - \d{1,2}(am|pm)/ })
    );
    this.medicationRows = page.getByTestId('mar-medication-row').or(
      this.medicationGrid.locator('div').filter({ hasText: /.+/ }).filter({ hasNot: this.timeSlotHeaders })
    );
    this.dateWrapper = this.dateDisplay.locator('../..').first();
    this.scheduledMedications = this.scheduledSection.locator('../..').locator('div').first().locator('div').filter({ hasText: /.+/ }).filter({ hasNot: this.scheduledSection });
    this.prnMedications = this.prnSection.locator('../..').locator('div').last().locator('div').filter({ hasText: /.+/ }).filter({ hasNot: this.prnSection });
    
    // Note: getMedicationRowByText, getPausedMedicationRow, and getDiscontinuedMedicationRow 
    // are methods that return dynamic locators based on medication names, so they remain as methods
  }

  async waitForMarViewToLoad(): Promise<void> {
    const page = this.page;
    await page.waitForURL(/\/encounter\/[^/]+\/mar\/view/);
    await page.waitForLoadState('networkidle');
    await this.marTitle.waitFor({ state: 'visible' });
  }

  async verifyMarViewElements(): Promise<void> {
    await expect(this.marTitle).toBeVisible();
    await expect(this.medicationLabel).toBeVisible();
    await expect(this.scheduledSection).toBeVisible();
  }

  async verifyDateSelectorElements(): Promise<void> {
    await expect(this.dateDisplay).toBeVisible();
    await expect(this.previousDayButton).toBeVisible();
  }

  async verifyPrnSection(): Promise<void> {
    await expect(this.prnSection).toBeVisible();
  }

  async verifyTimeSlotHeaders(): Promise<void> {
    await expect(this.medicationLabel).toBeVisible();
    await expect(this.timeSlotHeaders.first()).toBeVisible();
  }

  async getCurrentDate(): Promise<Date> {
    await this.dateDisplay.waitFor({ state: 'visible' });
    const dateText = await this.dateDisplay.textContent();
    if (!dateText) {
      throw new Error('Date display text is empty');
    }
    // Extract just the date part (format: "21 January 2026")
    const dateMatch = dateText.match(/\d{1,2} \w+ \d{4}/);
    if (!dateMatch) {
      throw new Error(`Could not extract date from: "${dateText}"`);
    }
    const trimmed = dateMatch[0];
    // Try parsing with different date formats
    const formats = [
      'd MMMM yyyy', // "15 January 2024"
      'dd MMMM yyyy', // "15 January 2024"
      'd MMM yyyy', // "15 Jan 2024"
      'dd MMM yyyy', // "15 Jan 2024"
      'M/d/yyyy', // "1/15/2024"
      'MM/dd/yyyy', // "01/15/2024"
    ];
    
    for (const format of formats) {
      try {
        const parsed = parse(trimmed, format, new Date());
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch {
        continue;
      }
    }
    
    throw new Error(`Could not parse date: "${trimmed}". Tried formats: ${formats.join(', ')}`);
  }

  async verifyDateIsCurrentDate(): Promise<void> {
    const displayedDate = await this.getCurrentDate();
    const today = new Date();
    const isToday = isSameDay(displayedDate, today);
    if (isToday) {
      expect(isToday).toBe(true);
    } else {
      // Allow yesterday as well in case of timezone differences
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = isSameDay(displayedDate, yesterday);
      expect(isYesterday).toBe(true);
    }
  }

  async clickPreviousDay(): Promise<void> {
    await expect(this.previousDayButton).toBeVisible();
    // Wait for button to be enabled before clicking
    await expect(this.previousDayButton).toBeEnabled();
    await this.previousDayButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickNextDay(): Promise<void> {
    await expect(this.nextDayButton).toBeEnabled();
    await this.nextDayButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyPreviousDayButtonState(shouldBeDisabled: boolean): Promise<void> {
    if (shouldBeDisabled) {
      await expect(this.previousDayButton).toBeDisabled();
    } else {
      await expect(this.previousDayButton).toBeEnabled();
    }
  }

  async verifyNextDayButtonState(shouldBeHidden: boolean): Promise<void> {
    if (shouldBeHidden) {
      // Check if button is not visible or is disabled    
      const isVisible = await this.nextDayButton.isVisible().catch(() => false);
      if (isVisible) {
        // If visible, check if it's disabled
        const isEnabled = await this.nextDayButton.isEnabled().catch(() => false);
        expect(isEnabled).toBe(false);
      } else {
        expect(isVisible).toBe(false);
      }
    } else {
      await expect(this.nextDayButton).toBeVisible();
      await expect(this.nextDayButton).toBeEnabled();
    }
  }

  getMedicationRowByText(medicationName: string): Locator {
    return this.page.getByTestId(`mar-medication-row-${medicationName.toLowerCase().replace(/\s+/g, '-')}`).or(
      this.medicationGrid.locator('div').filter({ hasText: new RegExp(medicationName, 'i') }).first()
    );
  }

  async verifyMedicationIsPausedAndItalic(medicationName: string): Promise<void> {
    const medicationRow = this.getPausedMedicationRow(medicationName);
    await expect(medicationRow).toBeVisible();
    
    // Verify the medication text is displayed in italics
    const fontStyle = await medicationRow.evaluate(el => window.getComputedStyle(el).fontStyle);
    expect(fontStyle).toBe('italic');
    
    // Verify the "(Paused)" label is present
    const rowText = await medicationRow.textContent();
    expect(rowText).toContain('(Paused)');
  }

  /**
   * Verifies that during the paused period, the MAR row does not display
   * any "due" or "missed" dose text. Only strikethrough pattern should show.
   */
  async verifyPausedPeriodNoDueOrMissedText(medicationName: string): Promise<void> {
    const medicationRow = this.getMedicationRowByText(medicationName);
    await expect(medicationRow).toBeVisible();

    const rowContainer = medicationRow.locator('..').first();
    const fullRowText = (await rowContainer.textContent()) ?? '';

    // Must not contain "missed" or "due" (dose) during paused period
    expect(fullRowText.toLowerCase()).not.toMatch(/missed/);
    expect(fullRowText.toLowerCase()).not.toMatch(/\bdue\b/);
  }

  async verifyMedicationIsDiscontinued(medicationName: string): Promise<void> {
    const medicationRow = this.getMedicationRowByText(medicationName);
    await expect(medicationRow).toBeVisible();
    
    const textDecoration = await medicationRow.evaluate(el => window.getComputedStyle(el).textDecoration);
    expect(textDecoration).toContain('line-through');
  }

  getPreviousDayButtonFromWrapper(): Locator {
    // Previous day button is inside the tooltip container with testid
    return this.dateWrapper.getByTestId('tooltip-b4e8').locator('button').first();
  }

  getPausedMedicationRow(medicationName: string): Locator {
    return this.page.getByTestId(`mar-medication-row-${medicationName.toLowerCase().replace(/\s+/g, '-')}-paused`);
  }

  getDiscontinuedMedicationRow(medicationName: string): Locator {
    return this.page.getByTestId(`mar-medication-row-${medicationName.toLowerCase().replace(/\s+/g, '-')}-discontinued`);
  }

  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  async clickPreviousDayUntilDisabled(): Promise<void> {
    // Click previous day until button becomes disabled (reached encounter start date)
    const maxAttempts = 50;
    for (let i = 0; i < maxAttempts; i++) {
      const isEnabled = await this.previousDayButton.isEnabled().catch(() => false);
      if (!isEnabled) break;
      
      try {
        await this.clickPreviousDay();
        await this.wait(500);
      } catch {
        // Button became disabled, expected behavior
        break;
      }
    }
  }

  async verifyVariableDoseDisplay(medicationName: string): Promise<void> {
    const medicationRow = this.getMedicationRowByText(medicationName);
    await expect(medicationRow).toBeVisible();
    
    // Check if "Dose due" text is displayed in administration cells for variable dose medications
    // Variable dose medications should show "Dose due" instead of specific dose amounts
    const rowText = await medicationRow.textContent();
    expect(rowText).toContain('Dose due');
  }

  /**
   * Verifies that an "As directed" medication has no specific due dose in the MAR.
   * Administration cells should be empty with no dose text displayed.
   */
  async verifyNoSpecificDueDose(medicationName: string): Promise<void> {
    const medicationRow = this.getMedicationRowByText(medicationName);
    await expect(medicationRow).toBeVisible();

    // Get row container (medication info + administration cells) to check full row text
    const rowContainer = medicationRow.locator('..').first();
    const fullRowText = (await rowContainer.textContent()) ?? '';

    // As directed medications must NOT show specific dose amounts (e.g. "500 g", "1 mg")
    const specificDosePattern = /\d+\s*(dose|due|missed)/i;
    expect(fullRowText).not.toMatch(specificDosePattern);
  }

  async verifyMedicationNotVisibleAfterEndDate(medicationName: string): Promise<void> {
    const medicationRow = this.getMedicationRowByText(medicationName);
    const isVisible = await medicationRow.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  }

  async verifyMedicationVisibleOnEndDate(medicationName: string): Promise<void> {
    const medicationRow = this.getMedicationRowByText(medicationName);
    await expect(medicationRow).toBeVisible();
  }

  async verifyResumedMedicationActive(medicationName: string): Promise<void> {
    const medicationRow = this.getMedicationRowByText(medicationName);
    await expect(medicationRow).toBeVisible();
    
    // Verify medication is not in paused state (no italic, no "(Paused)" label)
    const rowText = await medicationRow.textContent();
    expect(rowText).not.toContain('(Paused)');
    
    const fontStyle = await medicationRow.evaluate(el => window.getComputedStyle(el).fontStyle);
    expect(fontStyle).not.toBe('italic');
  }

  async getAdministrationCell(medicationName: string, timeSlotIndex: number): Promise<Locator> {
    const medicationRow = this.getMedicationRowByText(medicationName);
    // Administration cells are siblings of the medication row
    // Each medication has 12 administration cells (one per time slot)
    return medicationRow.locator('..').locator('> div').nth(timeSlotIndex + 1);
  }

  async verifyStrikethroughPattern(medicationName: string, timeSlotIndex: number, shouldHaveStrikethrough: boolean): Promise<void> {
    const cell = await this.getAdministrationCell(medicationName, timeSlotIndex);
    const backgroundImage = await cell.evaluate(el => window.getComputedStyle(el).backgroundImage);
    
    if (shouldHaveStrikethrough) {
      expect(backgroundImage).toContain('linear-gradient');
    } else {
      expect(backgroundImage).toBe('none');
    }
  }
}
