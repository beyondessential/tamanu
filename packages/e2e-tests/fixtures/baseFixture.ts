import { test as base, APIRequestContext, Page } from '@playwright/test';

import { createPatient, createApiContext, createHospitalAdmissionEncounterViaAPI, createClinicEncounterViaApi, createTriageEncounterViaApi } from '../utils/apiHelpers';
import {
  DashboardPage,
  LoginPage,
  SidebarPage,
  BedManagementPage,
  ReportsPage,
  ActiveImagingRequestsPage,
  CompletedImagingRequestsPage,
  ImmunisationRegisterPage,
  ActiveLabRequestsPage,
  PublishedLabRequestsPage,
  MedicationRequestsPage,
  AllPatientsPage,
  EmergencyPatientsPage,
  InpatientsPage,
  OutpatientsPage,
  PatientDetailsPage,
  PatientEncounterPage,
  ProgramRegistryPage,
  LocationBookingsPage,
  OutpatientAppointmentsPage,
} from '../pages';

type BaseFixtures = {
  api: APIRequestContext;
  newPatient: Awaited<ReturnType<typeof createPatient>>;
  newPatientWithHospitalAdmission: Awaited<ReturnType<typeof createPatient>>;
  newPatientWithClinicAdmission: Awaited<ReturnType<typeof createPatient>>;
  newPatientWithTriageAdmission: Awaited<ReturnType<typeof createPatient>>;
  dashboardPage: DashboardPage;
  loginPage: LoginPage;
  sidebarPage: SidebarPage;
  bedManagementPage: BedManagementPage;
  reportsPage: ReportsPage;
  activeImagingRequestPage: ActiveImagingRequestsPage;
  completedImagingRequestsPage: CompletedImagingRequestsPage;
  immunisationRegisterPage: ImmunisationRegisterPage;
  activeLabRequestsPage: ActiveLabRequestsPage;
  publishedLabRequestsPage: PublishedLabRequestsPage;
  medicationRequestsPage: MedicationRequestsPage;
  allPatientsPage: AllPatientsPage;
  emergencyPatientsPage: EmergencyPatientsPage;
  inpatientsPage: InpatientsPage;
  outpatientsPage: OutpatientsPage;
  patientDetailsPage: PatientDetailsPage;
  patientEncounterPage: PatientEncounterPage;
  programRegistryPage: ProgramRegistryPage;
  locationBookingsPage: LocationBookingsPage;
  outpatientAppointmentsPage: OutpatientAppointmentsPage;
};
export const test = base.extend<BaseFixtures>({
  api: async ({ page }: { page: Page }, use) => {
    const apiContext = await createApiContext({ page });
    await use(apiContext);
    await apiContext.dispose();
  },

  newPatient: async (
    { page, api }: { page: Page; api: APIRequestContext },
    use: (arg: Awaited<ReturnType<typeof createPatient>>) => Promise<void>,
  ) => {
    const patient = await createPatient(api, page);
    await use(patient);
  },

  newPatientWithHospitalAdmission: async (
    { page, api }: { page: Page; api: APIRequestContext },
    use: (arg: Awaited<ReturnType<typeof createPatient>>) => Promise<void>,
  ) => {
    const patient = await createPatient(api, page);
    await createHospitalAdmissionEncounterViaAPI(api, patient.id);
    await use(patient);
  },

  newPatientWithClinicAdmission: async (
    { page, api }: { page: Page; api: APIRequestContext },
    use: (arg: Awaited<ReturnType<typeof createPatient>>) => Promise<void>,
  ) => {
    const patient = await createPatient(api, page);
    await createClinicEncounterViaApi(api, patient.id);
    await use(patient);
  },

  newPatientWithTriageAdmission: async (
    { page, api }: { page: Page; api: APIRequestContext },
    use: (arg: Awaited<ReturnType<typeof createPatient>>) => Promise<void>,
  ) => {
    const patient = await createPatient(api, page);
    await createTriageEncounterViaApi(api, page, patient.id);
    await use(patient);
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  sidebarPage: async ({ page }, use) => {
    await use(new SidebarPage(page));
  },

  bedManagementPage: async ({ page }, use) => {
    await use(new BedManagementPage(page));
  },

  reportsPage: async ({ page }, use) => {
    await use(new ReportsPage(page));
  },

  activeImagingRequestPage: async ({ page }, use) => {
    await use(new ActiveImagingRequestsPage(page));
  },

  completedImagingRequestsPage: async ({ page }, use) => {
    await use(new CompletedImagingRequestsPage(page));
  },

  immunisationRegisterPage: async ({ page }, use) => {
    await use(new ImmunisationRegisterPage(page));
  },

  activeLabRequestsPage: async ({ page }, use) => {
    await use(new ActiveLabRequestsPage(page));
  },

  publishedLabRequestsPage: async ({ page }, use) => {
    await use(new PublishedLabRequestsPage(page));
  },

  medicationRequestsPage: async ({ page }, use) => {
    await use(new MedicationRequestsPage(page));
  },

  allPatientsPage: async ({ page }, use) => {
    await use(new AllPatientsPage(page));
  },

  emergencyPatientsPage: async ({ page }, use) => {
    await use(new EmergencyPatientsPage(page));
  },

  inpatientsPage: async ({ page }, use) => {
    await use(new InpatientsPage(page));
  },

  outpatientsPage: async ({ page }, use) => {
    await use(new OutpatientsPage(page));
  },

  patientDetailsPage: async ({ page }, use) => {
    await use(new PatientDetailsPage(page));
  },

  patientEncounterPage: async ({ page }, use) => {
    await use(new PatientEncounterPage(page));
  },

  programRegistryPage: async ({ page }, use) => {
    await use(new ProgramRegistryPage(page));
  },

  locationBookingsPage: async ({ page }, use) => {
    await use(new LocationBookingsPage(page));
  },

  outpatientAppointmentsPage: async ({ page }, use) => {
    await use(new OutpatientAppointmentsPage(page));
  },
});

export { expect } from '@playwright/test';
