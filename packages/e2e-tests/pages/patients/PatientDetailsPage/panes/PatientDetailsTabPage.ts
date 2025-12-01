
import { Locator, Page } from '@playwright/test';
import { BasePatientPane } from './BasePatientPane';
import { selectAutocompleteFieldOption, selectFieldOption } from '../../../../utils/fieldHelpers';


export interface PatientDetails {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  culturalName?: string;
  dateOfBirth?: string;
  sex?: 'male' | 'female';
  email?: string;
  nationalHealthNumber?: string;
  birthCertificate?: string;
  drivingLicense?: string;
  passport?: string;
  primaryContactNumber?: string;
  secondaryContactNumber?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  title?: string;
  maritalStatus?: string;
  bloodType?: string;
  birthLocation?: string;
  countryOfBirth?: string;
  nationality?: string;
  ethnicity?: string;
  religion?: string;
  educationalAttainment?: string;
  occupation?: string;
  socialMedia?: string;
  patientType?: string;
  mother?: string;
  father?: string;
  division?: string;
  medicalArea?: string;
  nursingZone?: string;
  cityTown?: string;
  country?: string;
  residentialLandmark?: string;
  selectFirstOption?: boolean;
}

export type PatientDetailsFormValues = PatientDetails;

export class PatientDetailsTabPage extends BasePatientPane {
  readonly contentPane!: Locator;
  readonly form!: Locator;
  readonly generalInformationHeading!: Locator;
  readonly identificationInformationHeading!: Locator;
  readonly contactInformationHeading!: Locator;
  readonly personalInformationHeading!: Locator;
  readonly locationInformationHeading!: Locator;

  readonly sexMaleRadio!: Locator;
  readonly sexFemaleRadio!: Locator;

  readonly firstNameInput!: Locator;
  readonly middleNameInput!: Locator;
  readonly lastNameInput!: Locator;
  readonly culturalNameInput!: Locator;
  readonly dateOfBirthInput!: Locator;
  readonly emailInput!: Locator;

  readonly nationalHealthNumberInput!: Locator;
  readonly birthCertificateInput!: Locator;
  readonly drivingLicenseInput!: Locator;
  readonly passportInput!: Locator;

  readonly primaryContactNumberInput!: Locator;
  readonly secondaryContactNumberInput!: Locator;
  readonly emergencyContactNameInput!: Locator;
  readonly emergencyContactNumberInput!: Locator;

  readonly titleSelect!: Locator;
  readonly maritalStatusSelect!: Locator;
  readonly bloodTypeSelect!: Locator;
  readonly birthLocationInput!: Locator;
  readonly countryOfBirthInput!: Locator;
  readonly nationalityInput!: Locator;
  readonly ethnicityInput!: Locator;
  readonly religionInput!: Locator;
  readonly educationalAttainmentSelect!: Locator;
  readonly occupationInput!: Locator;
  readonly socialMediaSelect!: Locator;
  readonly patientTypeSelect!: Locator;
  readonly motherInput!: Locator;
  readonly fatherInput!: Locator;

  readonly divisionInput!: Locator;
  readonly medicalAreaInput!: Locator;
  readonly nursingZoneInput!: Locator;
  readonly residentialLandmarkInput!: Locator;
  readonly cityTownInput!: Locator;
  readonly countryInput!: Locator;

  readonly saveButton!: Locator;

  constructor(page: Page) {
    super(page);

    const testIds = {
      contentPane: 'contentpane-p0hd',
      form: 'styledform-5o5i',
      generalInformationHeading: 'patientdetailsheading-3ftw',
      identificationInformationHeading: 'patientdetailsheading-hkyy',
      contactInformationHeading: 'patientdetailsheading-pipb',
      personalInformationHeading: 'patientdetailsheading-vd0y',
      locationInformationHeading: 'patientdetailsheading-ccov',
      sexMaleRadio: 'radio-il3t-male',
      sexFemaleRadio: 'radio-il3t-female',
      firstNameInput: 'localisedfield-cqua-input',
      middleNameInput: 'localisedfield-l6hc-input',
      lastNameInput: 'localisedfield-41un-input',
      culturalNameInput: 'localisedfield-ew4s-input',
      dateOfBirthInput: 'localisedfield-oafl-input',
      emailInput: 'localisedfield-j8v5-input',
      nationalHealthNumberInput: 'localisedfield-a0ac-input',
      birthCertificateInput: 'localisedfield-0jtf-birthCertificate-input',
      drivingLicenseInput: 'localisedfield-0jtf-drivingLicense-input',
      passportInput: 'localisedfield-0jtf-passport-input',
      primaryContactNumberInput: 'localisedfield-0jtf-primaryContactNumber-input',
      secondaryContactNumberInput: 'localisedfield-0jtf-secondaryContactNumber-input',
      emergencyContactNameInput: 'localisedfield-0jtf-emergencyContactName-input',
      emergencyContactNumberInput: 'localisedfield-0jtf-emergencyContactNumber-input',
      titleSelect: 'localisedfield-0jtf-title-select',
      maritalStatusSelect: 'localisedfield-0jtf-maritalStatus-select',
      bloodTypeSelect: 'localisedfield-0jtf-bloodType-select',
      birthLocationInput: 'localisedfield-0jtf-placeOfBirth-input',
      countryOfBirthInput: 'localisedfield-0jtf-countryOfBirthId-input',
      nationalityInput: 'localisedfield-0jtf-nationalityId-input',
      ethnicityInput: 'localisedfield-0jtf-ethnicityId-input',
      religionInput: 'localisedfield-0jtf-religionId-input',
      educationalAttainmentSelect: 'localisedfield-0jtf-educationalLevel-select',
      occupationInput: 'localisedfield-0jtf-occupationId-input',
      socialMediaSelect: 'localisedfield-0jtf-socialMedia-select',
      patientTypeSelect: 'selectinput-phtg-select',
      motherInput: 'localisedfield-0jtf-motherId-input',
      fatherInput: 'localisedfield-0jtf-fatherId-input',
      medicalAreaInput: 'localisedfield-0jtf-medicalAreaId-input',
      nursingZoneInput: 'localisedfield-0jtf-nursingZoneId-input',
      residentialLandmarkInput: 'localisedfield-0jtf-streetVillage-input',
      cityTownInput: 'localisedfield-0jtf-cityTown-input',
      countryInput: 'localisedfield-0jtf-countryId-input',
      saveButton: 'formsubmitbutton-dzgy',
    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }
    this.divisionInput = page.getByTestId('autocompleteinput-input').locator('input[name="divisionId"]');
  }

  async updatePatientDetailsFields(patientDetails: Partial<PatientDetails>): Promise<{
    religion: string;
    educationalAttainment: string;
    occupation: string;
    socialMedia: string;
    patientType: string;
    mother: string;
    father: string;
    medicalArea: string;
    nursingZone: string;
    country: string;
  }> {
    if (patientDetails.firstName) {
      await this.firstNameInput.fill(patientDetails.firstName);
    }
    if (patientDetails.middleName) {
      await this.middleNameInput.fill(patientDetails.middleName);
    }
    if (patientDetails.lastName) {
      await this.lastNameInput.fill(patientDetails.lastName);
    }
    if (patientDetails.culturalName) {
      await this.culturalNameInput.fill(patientDetails.culturalName);
    }
    if (patientDetails.dateOfBirth) {
      await this.dateOfBirthInput.locator('input').fill(patientDetails.dateOfBirth);
    }
    if (patientDetails.sex) {
      if (patientDetails.sex === 'female') {
        await this.sexFemaleRadio.click();
      } else {
        await this.sexMaleRadio.click();
      }
    }
    if (patientDetails.email) {
      await this.emailInput.fill(patientDetails.email);
    }                       
     if (patientDetails.nationalHealthNumber) {
      await this.nationalHealthNumberInput.fill(patientDetails.nationalHealthNumber);
    }
    if (patientDetails.birthCertificate) {
      await this.birthCertificateInput.fill(patientDetails.birthCertificate);
    }
    if (patientDetails.drivingLicense) {
      await this.drivingLicenseInput.fill(patientDetails.drivingLicense);
    }
    if (patientDetails.passport) {
      await this.passportInput.fill(patientDetails.passport);
    }
    if (patientDetails.countryOfBirth) {
      await this.countryOfBirthInput.fill(patientDetails.countryOfBirth);
    }
    if (patientDetails.nationality) {
      await this.nationalityInput.fill(patientDetails.nationality);
    }
    const religion = await selectAutocompleteFieldOption(this.page, this.religionInput, {
      selectFirst: true,
      returnOptionText: true,
    });
    const educationalAttainment = await selectFieldOption(this.page, this.educationalAttainmentSelect, {
      selectFirst: true,
      returnOptionText: true,
    });
    const occupation = await selectAutocompleteFieldOption(this.page, this.occupationInput, {
      selectFirst: true,
      returnOptionText: true,
    });
    const socialMedia = await selectFieldOption(this.page, this.socialMediaSelect, {
      selectFirst: true,
      returnOptionText: true,
    });
    const patientType = await selectFieldOption(this.page, this.patientTypeSelect, {
      selectFirst: true,
      returnOptionText: true,
    });
    const mother = await selectAutocompleteFieldOption(this.page, this.motherInput, {
      selectFirst: true,
      returnOptionText: true,
    });

    const father = await selectAutocompleteFieldOption(this.page, this.fatherInput, {
      selectFirst: true,
      returnOptionText: true,
    });

    const medicalArea = await selectAutocompleteFieldOption(this.page, this.medicalAreaInput, {
      selectFirst: true,
      returnOptionText: true,
    });
    const nursingZone = await selectAutocompleteFieldOption(this.page, this.nursingZoneInput, {
      selectFirst: true,
      returnOptionText: true,
    });
      if (patientDetails.cityTown) {
      await this.cityTownInput.fill(patientDetails.cityTown);
    }
    const country = await selectAutocompleteFieldOption(this.page, this.countryInput, {
      selectFirst: true,
      returnOptionText: true,
    });
    if (patientDetails.residentialLandmark) {
      await this.residentialLandmarkInput.fill(patientDetails.residentialLandmark);
    }
    return {
      religion: religion ?? '',
      educationalAttainment: educationalAttainment ?? '',
      occupation: occupation ?? '',
      socialMedia: socialMedia ?? '',
      patientType: patientType ?? '',
      mother: mother ?? '',
      father: father ?? '',
      medicalArea: medicalArea ?? '',
      nursingZone: nursingZone ?? '',
      country: country ?? '',
    };
 
  }
  async waitForSectionToLoad(): Promise<void> {
    await this.generalInformationHeading.waitFor({ state: 'visible', timeout: 10000 });
    await this.identificationInformationHeading.waitFor({ state: 'visible', timeout: 10000 });
    await this.contactInformationHeading.waitFor({ state: 'visible', timeout: 10000 });
    await this.personalInformationHeading.waitFor({ state: 'visible', timeout: 10000 });
    await this.locationInformationHeading.waitFor({ state: 'visible', timeout: 10000 });
  }
}


