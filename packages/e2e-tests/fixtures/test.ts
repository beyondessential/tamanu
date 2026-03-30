import { test as base, APIRequestContext, Page } from '@playwright/test';
import {
  createApiContext,
  createPatient,
  createHospitalAdmission,
  createClinicEncounter,
  createTriageEncounter,
} from './api';
import { Patient } from '@tamanu/database';

import { LoginPage } from '@pages/LoginPage';
import { AllPatientsPage } from '@pages/patients/AllPatientsPage';
import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';
import { InpatientsPage } from '@pages/patients/InpatientsPage';
import { OutpatientsPage } from '@pages/patients/OutpatientsPage';

type Fixtures = {
  api: APIRequestContext;
  newPatient: Patient;
  newPatientWithHospitalAdmission: Patient;
  newPatientWithClinicAdmission: Patient;
  newPatientWithTriageAdmission: Patient;
  loginPage: LoginPage;
  allPatientsPage: AllPatientsPage;
  patientDetailsPage: PatientDetailsPage;
  inpatientsPage: InpatientsPage;
  outpatientsPage: OutpatientsPage;
};

export const test = base.extend<Fixtures>({
  api: async ({ page }, use) => {
    const ctx = await createApiContext({ page });
    await use(ctx);
    await ctx.dispose();
  },

  newPatient: async ({ api, page }, use) => {
    await use(await createPatient(api, page));
  },

  newPatientWithHospitalAdmission: async ({ api, page }, use) => {
    const patient = await createPatient(api, page);
    await createHospitalAdmission(api, patient.id);
    await use(patient);
  },

  newPatientWithClinicAdmission: async ({ api, page }, use) => {
    const patient = await createPatient(api, page);
    await createClinicEncounter(api, patient.id);
    await use(patient);
  },

  newPatientWithTriageAdmission: async ({ api, page }, use) => {
    const patient = await createPatient(api, page);
    await createTriageEncounter(api, page, patient.id);
    await use(patient);
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  allPatientsPage: async ({ page }, use) => {
    await use(new AllPatientsPage(page));
  },

  patientDetailsPage: async ({ page }, use) => {
    await use(new PatientDetailsPage(page));
  },

  inpatientsPage: async ({ page }, use) => {
    await use(new InpatientsPage(page));
  },

  outpatientsPage: async ({ page }, use) => {
    await use(new OutpatientsPage(page));
  },
});

export { expect } from '@playwright/test';
