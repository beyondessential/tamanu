import config from 'config';
import { log } from '@tamanu/shared/services/logging';

import { PatientEmailCommunicationProcessor } from './PatientEmailCommunicationProcessor';
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

export { startFhirWorkerTasks } from './fhir';

export async function startScheduledTasks(context) {
  const taskClasses = [
    OutpatientDischarger,
    DeceasedPatientDischarger,
    PatientEmailCommunicationProcessor,
    ReportRequestProcessor,
    CertificateNotificationProcessor,
    IPSRequestProcessor,
    PatientMergeMaintainer,
    FhirMissingResources,
    PatientTelegramCommunicationProcessor,
    VaccinationReminderProcessor,
  ];

  // Add tasks requiring explicit enabled flag
  if (config.schedules.automaticLabTestResultPublisher.enabled) {
    taskClasses.push(AutomaticLabTestResultPublisher);
  }

  if (config.schedules.covidClearanceCertificatePublisher.enabled) {
    taskClasses.push(CovidClearanceCertificatePublisher);
  }

  if (config.schedules.staleSyncSessionCleaner.enabled) {
    taskClasses.push(StaleSyncSessionCleaner);
  }

  // Add tasks requiring integration enabled flag
  if (config.integrations.fijiVrs.enabled) {
    taskClasses.push(VRSActionRetrier);
  }

  if (config.integrations.signer.enabled) {
    taskClasses.push(SignerWorkingPeriodChecker, SignerRenewalChecker, SignerRenewalSender);
  }

  if (config.schedules.plannedMoveTimeout.enabled) {
    taskClasses.push(PlannedMoveTimeout);
  }

  const reportSchedulers = await getReportSchedulers(context);
  const tasks = [
    ...taskClasses.map(Task => {
      try {
        log.debug(`Starting to initialise scheduled task ${Task.name}`);
        return new Task(context);
      } catch (err) {
        log.warn('Failed to initialise scheduled task', { name: Task.name, err });
        return null;
      }
    }),
    ...reportSchedulers,
  ].filter(task => {
    if (!task) return false;
    const isTaskEnabled = config.schedules[task.name]?.enabled !== false;
    if (!isTaskEnabled) {
      log.info(`Skipping initialisation of task ${task.name} as it is disabled in config`);
    }
    return isTaskEnabled;
  });
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
