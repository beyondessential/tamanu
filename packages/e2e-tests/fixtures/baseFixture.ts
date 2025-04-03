import { test as base } from '@playwright/test';

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
  dashboardPage: DashboardPage;
  loginPage: LoginPage;
  sidebarPage: SidebarPage;
  bedMangementPage: BedManagementPage;
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
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  sidebarPage: async ({ page }, use) => {
    await use(new SidebarPage(page));
  },

  bedMangementPage: async ({ page }, use) => {
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
