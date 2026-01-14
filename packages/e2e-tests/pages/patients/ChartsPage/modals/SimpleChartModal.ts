import { Locator, Page } from '@playwright/test';
import { selectFieldOption } from '../../../../utils/fieldHelpers';

export interface SimpleChartFormValues {
    dateTime?: string;
    gcsEyeOpening?: string;
    gcsVerbalResponse?: string;
    gcsMotorResponse?: string;
    gcsTotalScore?: string;
    rightPupilsSize?: string;
    rightPupilsReaction?: string;
    leftPupilsSize?: string;
    leftPupilsReaction?: string;
    rightArmLimbMovement?: string[];
    rightLegLimbMovement?: string[];
    leftArmLimbMovement?: string[];
    leftLegLimbMovement?: string[];
    comments?: string;
}

export class SimpleChartModal {
  readonly page: Page;

  readonly form!: Locator;
  readonly dateTimeField!: Locator;
  readonly dateTimeInput!: Locator;
  readonly gcsEyeOpeningSelect!: Locator;
  readonly gcsVerbalResponseSelect!: Locator;
  readonly gcsMotorResponseSelect!: Locator;
  readonly gcsTotalScoreInput!: Locator;
  readonly rightPupilsSizeInput!: Locator;
  readonly rightPupilsReactionSelect!: Locator;
  readonly leftPupilsSizeInput!: Locator;
  readonly leftPupilsReactionSelect!: Locator;
  readonly rightArmLimbMovementMultiSelect!: Locator;
  readonly rightLegLimbMovementMultiSelect!: Locator;
  readonly leftArmLimbMovementMultiSelect!: Locator;
  readonly leftLegLimbMovementMultiSelect!: Locator;
  readonly commentsInput!: Locator;
  readonly confirmButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      form: 'styledform-5o5i',
      confirmButton: 'formsubmitcancelrow-1ah9-confirmButton',
      cancelButton: 'outlinedbutton-8rnr',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    this.dateTimeInput = this.form.getByText('Date & time').locator('..').locator('input');
    this.gcsEyeOpeningSelect = this.form.getByText('GCS Eye opening').locator('..').getByTestId('wrapperfieldcomponent-mkjr-select');
    this.gcsVerbalResponseSelect = this.form.getByText('GCS Verbal response').locator('..').getByTestId('wrapperfieldcomponent-mkjr-select');
    this.gcsMotorResponseSelect = this.form.getByText('GCS Motor response').locator('..').getByTestId('wrapperfieldcomponent-mkjr-select');
    this.rightPupilsReactionSelect = this.form.getByText('Right pupils reaction').locator('..').getByTestId('wrapperfieldcomponent-mkjr-select');
    this.leftPupilsReactionSelect = this.form.getByText('Left pupils reaction').locator('..').getByTestId('wrapperfieldcomponent-mkjr-select');

    // Number and text inputs - using name attribute
    this.gcsTotalScoreInput = this.form.getByText('GCS Total score').locator('..').locator('input');
    this.rightPupilsSizeInput = this.form.getByText('Right pupils size').locator('..').locator('input');
    this.leftPupilsSizeInput = this.form.getByText('Left pupils size').locator('..').locator('input');
    this.commentsInput = this.form.getByText('Comments').locator('..').locator('input');

    // Multi-select fields - find container that contains label text
    this.rightArmLimbMovementMultiSelect = this.form
      .getByTestId('multiselectinput-cxdw')
      .filter({ has: this.page.getByText('Right arm limb movement') })
      .first();
    this.rightLegLimbMovementMultiSelect = this.form
      .getByTestId('multiselectinput-cxdw')
      .filter({ has: this.page.getByText('Right leg limb movement') })
      .first();
    this.leftArmLimbMovementMultiSelect = this.form
      .getByTestId('multiselectinput-cxdw')
      .filter({ has: this.page.getByText('Left arm limb movement') })
      .first();
    this.leftLegLimbMovementMultiSelect = this.form
      .getByTestId('multiselectinput-cxdw')
      .filter({ has: this.page.getByText('Left leg limb movement') })
      .first();
  }

  async waitForModalToLoad(): Promise<void> {
    await this.dateTimeInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async fillForm(values: SimpleChartFormValues): Promise<SimpleChartFormValues> {
    let gcsEyeOpening: string | undefined;
    let gcsVerbalResponse: string | undefined;
    let gcsMotorResponse: string | undefined;
    let rightPupilsReaction: string | undefined;
    let leftPupilsReaction: string | undefined;

    if (values.dateTime) {
      await this.dateTimeInput.fill(values.dateTime);
    }
    if (values.gcsEyeOpening) {
      gcsEyeOpening = await selectFieldOption(this.page, this.gcsEyeOpeningSelect, {
        optionToSelect: values.gcsEyeOpening,
        returnOptionText: true,
      });
    } else {
      gcsEyeOpening = await selectFieldOption(this.page, this.gcsEyeOpeningSelect, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    if (values.gcsVerbalResponse) {
      gcsVerbalResponse = await selectFieldOption(this.page, this.gcsVerbalResponseSelect, {
        optionToSelect: values.gcsVerbalResponse,
        returnOptionText: true,
      });
    } else {
      gcsVerbalResponse = await selectFieldOption(this.page, this.gcsVerbalResponseSelect, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    if (values.gcsMotorResponse) {
      gcsMotorResponse = await selectFieldOption(this.page, this.gcsMotorResponseSelect, {
        optionToSelect: values.gcsMotorResponse,
        returnOptionText: true,
      });
    } else {
      gcsMotorResponse = await selectFieldOption(this.page, this.gcsMotorResponseSelect, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    // Fill number inputs
    if (values.gcsTotalScore !== undefined) {
      await this.gcsTotalScoreInput.fill(values.gcsTotalScore);
    }

    if (values.rightPupilsSize !== undefined) {
      await this.rightPupilsSizeInput.fill(values.rightPupilsSize);
    }

    if (values.leftPupilsSize !== undefined) {
      await this.leftPupilsSizeInput.fill(values.leftPupilsSize);
    }

    if (values.rightPupilsReaction) {
      rightPupilsReaction = await selectFieldOption(this.page, this.rightPupilsReactionSelect, {
        optionToSelect: values.rightPupilsReaction,
        returnOptionText: true,
      });
    } else {
      rightPupilsReaction = await selectFieldOption(this.page, this.rightPupilsReactionSelect, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    if (values.leftPupilsReaction) {
      leftPupilsReaction = await selectFieldOption(this.page, this.leftPupilsReactionSelect, {
        optionToSelect: values.leftPupilsReaction,
        returnOptionText: true,
      });
    } else {
      leftPupilsReaction = await selectFieldOption(this.page, this.leftPupilsReactionSelect, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    if (values.rightArmLimbMovement) {
      await this.selectMultiSelectOptions(this.rightArmLimbMovementMultiSelect, values.rightArmLimbMovement);
    }

    if (values.rightLegLimbMovement) {
      await this.selectMultiSelectOptions(this.rightLegLimbMovementMultiSelect, values.rightLegLimbMovement);
    }

    if (values.leftArmLimbMovement) {
      await this.selectMultiSelectOptions(this.leftArmLimbMovementMultiSelect, values.leftArmLimbMovement);
    }

    if (values.leftLegLimbMovement) {
      await this.selectMultiSelectOptions(this.leftLegLimbMovementMultiSelect, values.leftLegLimbMovement);
    }

    // Fill comments
    if (values.comments !== undefined) {
      await this.commentsInput.fill(values.comments);
    }

    return {
      ...values,
      dateTime: await this.dateTimeInput.inputValue(),
      gcsEyeOpening: gcsEyeOpening || values.gcsEyeOpening,
      gcsVerbalResponse: gcsVerbalResponse || values.gcsVerbalResponse,
      gcsMotorResponse: gcsMotorResponse || values.gcsMotorResponse,
      rightPupilsReaction: rightPupilsReaction || values.rightPupilsReaction,
      leftPupilsReaction: leftPupilsReaction || values.leftPupilsReaction,
    };
  }
  async selectMultiSelectOptions(multiSelectField: Locator, options: string[]): Promise<void> {
    await multiSelectField.click();
    for (const option of options) {
      await multiSelectField.getByText(option, { exact: true }).click();
    }
    await multiSelectField.click();
  }
}

