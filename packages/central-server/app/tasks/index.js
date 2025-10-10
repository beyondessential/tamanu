import config from 'config';

import { log } from '@tamanu/shared/services/logging';
import { SendStatusToMetaServer } from '@tamanu/shared/tasks/SendStatusToMetaServer';

import { PatientEmailCommunicationProcessor } from './PatientEmailCommunicationProcessor';
import { PortalCommunicationProcessor } from './PortalCommunicationProcessor';
import { PatientMergeMaintainer } from './PatientMergeMaintainer';
import { OutpatientDischarger } from './OutpatientDischarger';
import { DeceasedPatientDischarger } from './DeceasedPatientDischarger';
import { ReportRequestProcessor } from './ReportRequestProcessor';
import { ReportRequestScheduler } from './ReportRequestScheduler';
import { VRSActionRetrier } from './VRSActionRetrier';
import { SignerWorkingPeriodChecker } from './SignerWorkingPeriodChecker';
import { SignerRenewalChecker } from './SignerRenewalChecker';
import { SignerRenewalSender } from './SignerRenewalSender';
import { CertificateNotificationProcessor } from './CertificateNotificationProcessor';
import { IPSRequestProcessor } from './IPSRequestProcessor';
import { AutomaticLabTestResultPublisher } from './AutomaticLabTestResultPublisher';
import { CovidClearanceCertificatePublisher } from './CovidClearanceCertificatePublisher';
import { PlannedMoveTimeout } from './PlannedMoveTimeout';
import { StaleSyncSessionCleaner } from './StaleSyncSessionCleaner';
import { FhirMissingResources } from './FhirMissingResources';
import { PatientTelegramCommunicationProcessor } from './PatientTelegramCommunicationProcessor';
import { VaccinationReminderProcessor } from './VaccinationReminderProcessor';
import { SurveyCompletionNotifierProcessor } from './SurveyCompletionNotifierProcessor';
import { SyncLookupRefresher } from './SyncLookupRefresher';
import { GenerateRepeatingTasks } from './GenerateRepeatingTasks';
import { GenerateRepeatingAppointments } from './GenerateRepeatingAppointments';
import { GenerateMedicationAdministrationRecords } from './GenerateMedicationAdministrationRecords';
import { MedicationDiscontinuer } from './MedicationDiscontinuer';
import { DHIS2IntegrationProcessor } from './DHIS2IntegrationProcessor';

export { startFhirWorkerTasks } from './fhir';

export class InvalidConfigError extends Error {}

export async function startScheduledTasks(context) {
  const taskClasses = [
    OutpatientDischarger,
    DeceasedPatientDischarger,
    PatientEmailCommunicationProcessor,
    PortalCommunicationProcessor,
    ReportRequestProcessor,
    CertificateNotificationProcessor,
    IPSRequestProcessor,
    PatientMergeMaintainer,
    PatientTelegramCommunicationProcessor,
    VaccinationReminderProcessor,
    AutomaticLabTestResultPublisher,
    CovidClearanceCertificatePublisher,
    StaleSyncSessionCleaner,
    PlannedMoveTimeout,
    FhirMissingResources,
    SurveyCompletionNotifierProcessor,
    SyncLookupRefresher,
    GenerateRepeatingTasks,
    GenerateRepeatingAppointments,
    GenerateMedicationAdministrationRecords,
    MedicationDiscontinuer,
    DHIS2IntegrationProcessor,
    SendStatusToMetaServer,
  ];

  if (config.integrations.fijiVrs.enabled) {
    taskClasses.push(VRSActionRetrier);
  }
  if (config.integrations.signer.enabled) {
    taskClasses.push(SignerWorkingPeriodChecker, SignerRenewalChecker, SignerRenewalSender);
  }

  const reportSchedulers = await getReportSchedulers(context);
  const tasks = [
    ...taskClasses.map(TaskClass => {
      try {
        log.debug(`Starting to initialise scheduled task ${TaskClass.name}`);
        return new TaskClass(context);
      } catch (err) {
        log.warn('Failed to initialise scheduled task', { name: TaskClass.name, err });
        return null;
      }
    }),
    ...reportSchedulers,
  ].filter(x => x);
  tasks.forEach(t => t.beginPolling());
  return () => tasks.forEach(t => t.cancelPolling());
}

async function getReportSchedulers(context) {
  const systemUser = await context.store.models.User.getSystemUser();

  const schedulers = [];
  for (const options of config.scheduledReports) {
    schedulers.push(
      new ReportRequestScheduler(context, { ...options, requestedByUserId: systemUser.id }),
    );
  }
  return schedulers;
}
