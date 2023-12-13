import { log } from '@tamanu/shared/services/logging';
import config from 'config';

import { AutomaticLabTestResultPublisher } from './AutomaticLabTestResultPublisher';
import { CertificateNotificationProcessor } from './CertificateNotificationProcessor';
import { CovidClearanceCertificatePublisher } from './CovidClearanceCertificatePublisher';
import { DeceasedPatientDischarger } from './DeceasedPatientDischarger';
import { FhirMissingResources } from './FhirMissingResources';
import { OutpatientDischarger } from './OutpatientDischarger';
import { PatientEmailCommunicationProcessor } from './PatientEmailCommunicationProcessor';
import { PatientMergeMaintainer } from './PatientMergeMaintainer';
import { PlannedMoveTimeout } from './PlannedMoveTimeout';
import { ReportRequestProcessor } from './ReportRequestProcessor';
import { ReportRequestScheduler } from './ReportRequestScheduler';
import { SignerRenewalChecker } from './SignerRenewalChecker';
import { SignerRenewalSender } from './SignerRenewalSender';
import { SignerWorkingPeriodChecker } from './SignerWorkingPeriodChecker';
import { StaleSyncSessionCleaner } from './StaleSyncSessionCleaner';
import { VRSActionRetrier } from './VRSActionRetrier';

export { startFhirWorkerTasks } from './fhir';

export async function startScheduledTasks(context) {
  const taskClasses = [
    OutpatientDischarger,
    DeceasedPatientDischarger,
    PatientEmailCommunicationProcessor,
    ReportRequestProcessor,
    CertificateNotificationProcessor,
    PatientMergeMaintainer,
    FhirMissingResources,
  ];

  if (config.schedules.automaticLabTestResultPublisher.enabled) {
    taskClasses.push(AutomaticLabTestResultPublisher);
  }

  if (config.schedules.covidClearanceCertificatePublisher.enabled) {
    taskClasses.push(CovidClearanceCertificatePublisher);
  }

  if (config.integrations.fijiVrs.enabled) {
    taskClasses.push(VRSActionRetrier);
  }

  if (config.integrations.signer.enabled) {
    taskClasses.push(SignerWorkingPeriodChecker, SignerRenewalChecker, SignerRenewalSender);
  }

  if (config.schedules.plannedMoveTimeout.enabled) {
    taskClasses.push(PlannedMoveTimeout);
  }

  if (config.schedules.staleSyncSessionCleaner.enabled) {
    taskClasses.push(StaleSyncSessionCleaner);
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
