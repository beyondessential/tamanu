import { test as base, APIRequestContext, Page } from '@playwright/test';

import {
  createPatient,
  createApiContext,
  createHospitalAdmissionEncounterViaAPI,
  createClinicEncounterViaApi,
  createTriageEncounterViaApi,
  getUser,
  type CurrentUser,
} from '../utils/apiHelpers';
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
import { LabRequestPane } from '../pages/patients/LabRequestPage/panes/LabRequestPane';
import { LabRequestModal } from '../pages/patients/LabRequestPage/modals/LabRequestModal';
import { NotesPane } from '../pages/patients/NotesPage/panes/notesPane';
import { ProcedurePane } from '../pages/patients/ProcedurePage/Panes/ProcedurePane';
import { PatientVaccinePane } from '../pages/patients/PatientDetailsPage/panes/PatientVaccinePane';

export type { CurrentUser, PatientOnLabsTab, PatientOnNotesTab, PatientOnProceduresTab, PatientOnVaccinesTab };

type PatientOnLabsTab = {
  patient: Awaited<ReturnType<typeof createPatient>>;
  labRequestPane: LabRequestPane;
  labRequestModal: LabRequestModal;
  patientDetailsPage: PatientDetailsPage;
};

type PatientOnNotesTab = {
  patient: Awaited<ReturnType<typeof createPatient>>;
  notesPane: NotesPane;
  patientDetailsPage: PatientDetailsPage;
};

type PatientOnProceduresTab = {
  patient: Awaited<ReturnType<typeof createPatient>>;
  procedurePane: ProcedurePane;
  patientDetailsPage: PatientDetailsPage;
};

type PatientOnVaccinesTab = {
  patient: Awaited<ReturnType<typeof createPatient>>;
  vaccinePane: PatientVaccinePane;
  patientDetailsPage: PatientDetailsPage;
};

type BaseFixtures = {
  api: APIRequestContext;
  /** Logged-in facility user from `/api/user/me` (lazy; only fetched when the test uses this fixture). */
  currentUser: CurrentUser;
  newPatient: Awaited<ReturnType<typeof createPatient>>;
  newPatientWithHospitalAdmission: Awaited<ReturnType<typeof createPatient>>;
  newPatientWithClinicAdmission: Awaited<ReturnType<typeof createPatient>>;
  newPatientWithTriageAdmission: Awaited<ReturnType<typeof createPatient>>;
  /** Admitted patient navigated to the Labs encounter tab with page objects ready. */
  patientOnLabsTab: PatientOnLabsTab;
  /** Admitted patient navigated to the Notes encounter tab with page objects ready. */
  patientOnNotesTab: PatientOnNotesTab;
  /** Admitted patient navigated to the Procedures encounter tab with page objects ready. */
  patientOnProceduresTab: PatientOnProceduresTab;
  /** Patient navigated to the Vaccines patient-level tab with page objects ready. */
  patientOnVaccinesTab: PatientOnVaccinesTab;
  dashboardPage: DashboardPage;
  loginPage: LoginPage;
  sidebarPage: SidebarPage;
  bedManagementPage: BedManagementPage;
  reportsPage: ReportsPage;
  activeImagingRequestsPage: ActiveImagingRequestsPage;
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

  currentUser: async ({ api }, use) => {
    await use(await getUser(api));
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

  patientOnLabsTab: async ({ page, api, patientDetailsPage }, use) => {
    const patient = await createPatient(api, page);
    await createHospitalAdmissionEncounterViaAPI(api, patient.id);
    await patientDetailsPage.goToPatient(patient);
    await patientDetailsPage.navigateToLabsTab();
    await use({
      patient,
      labRequestPane: new LabRequestPane(page),
      labRequestModal: new LabRequestModal(page),
      patientDetailsPage,
    });
  },

  patientOnNotesTab: async ({ page, api, patientDetailsPage }, use) => {
    const patient = await createPatient(api, page);
    await createHospitalAdmissionEncounterViaAPI(api, patient.id);
    await patientDetailsPage.goToPatient(patient);
    const notesPane = await patientDetailsPage.navigateToNotesTab();
    await use({ patient, notesPane, patientDetailsPage });
  },

  patientOnProceduresTab: async ({ page, api, patientDetailsPage }, use) => {
    const patient = await createPatient(api, page);
    await createHospitalAdmissionEncounterViaAPI(api, patient.id);
    await patientDetailsPage.goToPatient(patient);
    const procedurePane = await patientDetailsPage.navigateToProcedureTab();
    await use({ patient, procedurePane, patientDetailsPage });
  },

  patientOnVaccinesTab: async ({ page, api, patientDetailsPage }, use) => {
    const patient = await createPatient(api, page);
    await patientDetailsPage.goToPatient(patient);
    const vaccinePane = await patientDetailsPage.navigateToVaccineTab();
    await use({ patient, vaccinePane, patientDetailsPage });
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

  activeImagingRequestsPage: async ({ page }, use) => {
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
