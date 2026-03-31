import { Locator, Page, expect } from '@playwright/test';
import { Patient } from '@tamanu/database';
import { constructFacilityUrl } from '@utils/navigation';
import { routes } from '@config/routes';
import { BasePatientPage } from '../BasePatientPage';
import { PatientVaccinePane } from './panes/PatientVaccinePane';
import { LabRequestPane } from '../LabRequestPage/panes/LabRequestPane';
import { ProcedurePane } from '../ProcedurePage/Panes/ProcedurePane';
import { format } from 'date-fns';
import { NotesPane } from '../NotesPage/panes/notesPane';
import { PrepareDischargeModal } from './modals/PrepareDischargeModal';
import { CreateEncounterModal } from './modals/CreateEncounterModal';
import { EmergencyTriageModal } from './modals/EmergencyTriageModal';
import { PatientDetailsTabPage } from './panes/PatientDetailsTabPage';
import { AllPatientsPage } from '../AllPatientsPage';
import { EncounterMedicationPane } from '../MedicationsPage/panes/EncounterMedicationPane';
import { EncounterHistoryPane } from './panes/EncounterHistoryPane';
import { ChangeEncounterDetailsMenu } from './ChangeEncounterDetailsMenu';
import { AddDiagnosisModal } from './modals/AddDiagnosisModal';
import { DocumentsPane } from './panes/DocumentsPane';
import { TasksPane } from '../TaskPage/panes/TasksPane';
import { ChartsPane } from '../ChartsPage/panes/ChartsPane';
import { ReferralPane } from './panes/ReferralPane';
import { EditEncounterModal } from './modals/EditEncounterModal';
import { PatientSidebarListsSection } from './panes/PatientSidebarListsSection';

export class PatientDetailsPage extends BasePatientPage {
  readonly prepareDischargeButton: Locator;
  readonly vaccineTab: Locator;
  readonly procedureTab: Locator;
  readonly healthIdText: Locator;
  patientVaccinePane?: PatientVaccinePane;
  patientProcedurePane?: ProcedurePane;
  prepareDischargeModal?: PrepareDischargeModal;
  createEncounterModal?: CreateEncounterModal;
  emergencyTriageModal?: EmergencyTriageModal;
  notesPane?: NotesPane;
  patientDetailsTabPage?: PatientDetailsTabPage;
  encounterMedicationPane?: EncounterMedicationPane;
  documentsPane?: DocumentsPane;
  tasksPane?: TasksPane;
  chartsPane?: ChartsPane;
  referralPane?: ReferralPane;
  editEncounterModal?: EditEncounterModal;
  arrowDownIconMenuButton: Locator;
  threeDotMenuButton: Locator;
  editEncounterMenuItem: Locator;
  movePatientButton: Locator;

  private _encounterHistoryPane?: EncounterHistoryPane;
  private _changeEncounterDetailsMenu?: ChangeEncounterDetailsMenu;
  private _addDiagnosisModal?: AddDiagnosisModal;
  private _sidebarLists?: PatientSidebarListsSection;

  readonly encounterMedicationTab: Locator;
  readonly patientNHN: Locator;
  readonly labsTab: Locator;
  readonly notesTab: Locator;
  readonly vitalsTab: Locator;
  readonly imagingTab: Locator;
  readonly documentsTab: Locator;
  readonly tasksTab: Locator;
  readonly chartsTab: Locator;
  readonly referralsTab: Locator;
  readonly encountersList: Locator;
  readonly departmentLabel: Locator;
  readonly admitOrCheckinButton: Locator;
  readonly patientDetailsTab: Locator;
  readonly dietLabel: Locator;
  readonly locationLabel: Locator;
  readonly addDiagnosisButton: Locator;
  readonly diagnosisContainer: Locator;
  readonly diagnosisCategory: Locator;
  readonly diagnosisName: Locator;
  labRequestPane?: LabRequestPane;
  constructor(page: Page) {
    super(page);
    this.prepareDischargeButton = this.page.getByRole('button', { name: 'Prepare discharge', exact: true });
    this.vaccineTab = this.page.getByTestId('tab-vaccines');
    this.procedureTab = this.page.getByTestId('styledtab-ccs8-procedures');
    this.healthIdText = this.page.getByTestId('healthidtext-fqvn');
    this.patientNHN = this.page.getByTestId('healthidtext-fqvn');
    this.labsTab = this.page.getByTestId('styledtab-ccs8-labs');
    this.notesTab = this.page.getByTestId('styledtab-ccs8-notes');
    this.vitalsTab = this.page.getByTestId('styledtab-ccs8-vitals');
    this.imagingTab = this.page.getByTestId('styledtab-ccs8-imaging');
    this.documentsTab = this.page.getByTestId('tab-documents');
    this.tasksTab = this.page.getByTestId('styledtab-ccs8-tasks');
    this.chartsTab = this.page.getByTestId('styledtab-ccs8-charts');
    this.referralsTab = this.page.getByTestId('tab-referrals');
    this.encounterMedicationTab = this.page.getByTestId('styledtab-ccs8-medication');
    this.encountersList=this.page.getByTestId('styledtablebody-a0jz').locator('tr');
    this.departmentLabel=this.page.getByTestId('cardlabel-0v8z').filter({ hasText: 'Department' }).locator('..').getByTestId('cardvalue-1v8z');
    this.dietLabel=this.page.getByTestId('cardlabel-0v8z').filter({ hasText: 'Diet' }).locator('..').getByTestId('cardvalue-1v8z');
    this.locationLabel=this.page.getByTestId('cardlabel-0v8z').filter({ hasText: 'Location' }).locator('..').getByTestId('cardvalue-1v8z');
    this.admitOrCheckinButton=this.page.getByTestId('component-enxe').filter({ hasText: 'Admit or check-in' });
    this.patientDetailsTab=this.page.getByTestId('tab-details');
    this.arrowDownIconMenuButton=this.page.getByTestId('menubutton-dc8o');
    this.threeDotMenuButton=this.page.getByTestId('stylediconbutton-szh8');
    this.editEncounterMenuItem=this.page.getByTestId('menuitem-0');
    this.movePatientButton=this.page.getByRole('button', { name: 'Move patient' });
    this.addDiagnosisButton=this.page.getByTestId('adddiagnosisbutton-2ij9');
    this.diagnosisContainer=this.page.getByTestId('diagnosislistcontainer-dqkk');
    this.diagnosisCategory=this.page.getByTestId('category-vwwx');
    this.diagnosisName=this.page.getByTestId('diagnosisname-vvn4');
  }

  async navigateToVaccineTab(): Promise<PatientVaccinePane> {
    await this.vaccineTab.click();
    if (!this.patientVaccinePane) {
      this.patientVaccinePane = new PatientVaccinePane(this.page);
    }
    return this.patientVaccinePane;
  }

  async navigateToProcedureTab(): Promise<ProcedurePane> {
    await this.encountersList.first().waitFor({ state: 'visible' });
    await this.encountersList.first().filter({ hasText: 'Hospital admission' }).click();
    await this.procedureTab.click();
    if (!this.patientProcedurePane) {
      this.patientProcedurePane = new ProcedurePane(this.page);
    }
    return this.patientProcedurePane;
  }

  async navigateToLabsTab(): Promise<LabRequestPane> {
    // Navigate to the top encounter
    await this.encountersList.first().waitFor({ state: 'visible' });
    await this.encountersList.first().filter({ hasText: 'Hospital admission' }).click();
    await this.labsTab.click();
    if (!this.labRequestPane) {
      this.labRequestPane = new LabRequestPane(this.page);
    }
    return this.labRequestPane;
  }
  async navigateToNotesTab(): Promise<NotesPane> {
    // Navigate to the top encounter
    await this.encountersList.first().waitFor({ state: 'visible' });
    await this.encountersList.first().filter({ hasText: 'Hospital admission' }).click();
    await this.notesTab.click();
    if (!this.notesPane) {
      this.notesPane = new NotesPane(this.page);
    }
    return this.notesPane;
  }

  async navigateToVitalsTab(): Promise<void> {
    await this.vitalsTab.click();
  }

  async navigateToDocumentsTab(): Promise<DocumentsPane> {
    await this.documentsTab.click();
    if (!this.documentsPane) {
      this.documentsPane = new DocumentsPane(this.page);
    }
    return this.documentsPane;
  }

  async waitForEncounterToBeReady(): Promise<void> {
    // Wait for URL to contain encounter ID
    await this.page.waitForURL(/\/encounter\/[^/]+/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async navigateToTasksTab(): Promise<TasksPane> {
    await this.tasksTab.click();
    if (!this.tasksPane) {
      this.tasksPane = new TasksPane(this.page);
    }
    return this.tasksPane;
  }

  async navigateToChartsTab(): Promise<ChartsPane> {
    await this.chartsTab.click();
    if (!this.chartsPane) {
      this.chartsPane = new ChartsPane(this.page);
    }
    return this.chartsPane;
  }

  async navigateToReferralsTab(): Promise<ReferralPane> {
    await this.referralsTab.click();
    if (!this.referralPane) {
      this.referralPane = new ReferralPane(this.page);
    }
    return this.referralPane;
  }


  async navigateToImagingRequestTab(): Promise<void> {
    await this.encountersList.first().waitFor({ state: 'visible' });
    await this.encountersList.first().click();
    await this.imagingTab.click();
  }

  async navigateToPatientDetailsTab(): Promise<PatientDetailsTabPage> {
    await this.patientDetailsTab.click();
    if (!this.patientDetailsTabPage) {
      this.patientDetailsTabPage = new PatientDetailsTabPage(this.page);
    }
    return this.patientDetailsTabPage;
  }

  async navigateToAllPatientsPage(): Promise<AllPatientsPage> {
    await this.page.goto(constructFacilityUrl(`${routes.patients.all}`));
    return new AllPatientsPage(this.page);
  }

  async navigateToMedicationTab(): Promise<EncounterMedicationPane> {
    await this.encountersList.first().waitFor({ state: 'visible' });
    await this.encountersList.first().click();
    await this.encounterMedicationTab.click();
    if (!this.encounterMedicationPane) {
      this.encounterMedicationPane = new EncounterMedicationPane(this.page);
    }
    await this.encounterMedicationPane.waitForPaneToLoad();
    return this.encounterMedicationPane;
  }

  async goToPatient(patient: Patient) {
    await this.page.goto(constructFacilityUrl(`/patients/all/${patient.id}`));
  }

  get sidebarLists(): PatientSidebarListsSection {
    if (!this._sidebarLists) {
      this._sidebarLists = new PatientSidebarListsSection(this.page);
    }
    return this._sidebarLists;
  }

  async confirmPatientDetailsPageHasLoaded() {
    await expect(this.vaccineTab).toBeVisible();
  }

  async clickAddButtonToConfirm(buttonLocator: Locator) {
    await this.page.waitForLoadState('networkidle');
    await buttonLocator.click();
    await this.page.waitForLoadState('networkidle');
  }

  getCurrentBrowserDateISOFormat() {
    return format(new Date(), 'yyyy-MM-dd');
  }

  getPrepareDischargeModal(): PrepareDischargeModal {
    if (!this.prepareDischargeModal) {
      this.prepareDischargeModal = new PrepareDischargeModal(this.page);
    }
    return this.prepareDischargeModal;
  }

  getCreateEncounterModal(): CreateEncounterModal {
    if (!this.createEncounterModal) {
      this.createEncounterModal = new CreateEncounterModal(this.page);
    }
    return this.createEncounterModal;
  }

  getEmergencyTriageModal(): EmergencyTriageModal {
    if (!this.emergencyTriageModal) {
      this.emergencyTriageModal = new EmergencyTriageModal(this.page);
    }
    return this.emergencyTriageModal;
  }

  getAddDiagnosisModal(): AddDiagnosisModal {
    if (!this._addDiagnosisModal) {
      this._addDiagnosisModal = new AddDiagnosisModal(this.page);
    }
    return this._addDiagnosisModal;
  }

  getEditEncounterModal(): EditEncounterModal {
    if (!this.editEncounterModal) {
      this.editEncounterModal = new EditEncounterModal(this.page);
    }
    return this.editEncounterModal;
  }

  async openEditEncounterModal(): Promise<EditEncounterModal> {
    await this.threeDotMenuButton.click();
    await this.editEncounterMenuItem.waitFor({ state: 'visible' });
    await this.editEncounterMenuItem.click();
    const modal = this.getEditEncounterModal();
    await modal.waitForModalToLoad();
    return modal;
  }

  get encounterHistoryPane(): EncounterHistoryPane {
    if (!this._encounterHistoryPane) {
      this._encounterHistoryPane = new EncounterHistoryPane(this.page);
    }
    return this._encounterHistoryPane;
  }

  get changeEncounterDetailsMenu(): ChangeEncounterDetailsMenu {
    if (!this._changeEncounterDetailsMenu) {
      this._changeEncounterDetailsMenu = new ChangeEncounterDetailsMenu(this.page);
    }
    return this._changeEncounterDetailsMenu;
  }

  async admitToHospital(): Promise<Record<string, string>> {
    await this.admitOrCheckinButton.click();
    const createEncounterModal = this.getCreateEncounterModal();
    await createEncounterModal.waitForModalToLoad();
    await createEncounterModal.hospitalAdmissionButton.click();
    const hospitalAdmissionModal = createEncounterModal.getHospitalAdmissionModal();
    await hospitalAdmissionModal.waitForModalToLoad();
    const formValues = await hospitalAdmissionModal.fillHospitalAdmissionForm();
    await hospitalAdmissionModal.confirmButton.click();
    return formValues;
  }
}
