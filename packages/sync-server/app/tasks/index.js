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
import { AutomaticLabTestResultPublisher } from './AutomaticLabTestResultPublisher';
import { CovidClearanceCertificatePublisher } from './CovidClearanceCertificatePublisher';
import { PlannedMoveTimeout } from './PlannedMoveTimeout';
import { StaleSyncSessionCleaner } from './StaleSyncSessionCleaner';
import { FhirMissingResources } from './FhirMissingResources';

export { startFhirWorkerTasks } from './fhir';

export async function startScheduledTasks(context) {
  const { settings } = context;
  const schedules = await settings.get('schedules');
  const integrations = await settings.get('integrations');

  const taskClasses = [
    OutpatientDischarger,
    DeceasedPatientDischarger,
    PatientEmailCommunicationProcessor,
    ReportRequestProcessor,
    CertificateNotificationProcessor,
    PatientMergeMaintainer,
    FhirMissingResources,
  ];

  if (schedules.automaticLabTestResultPublisher.enabled) {
    taskClasses.push(AutomaticLabTestResultPublisher);
  }

  if (schedules.covidClearanceCertificatePublisher.enabled) {
    taskClasses.push(CovidClearanceCertificatePublisher);
  }

  if (integrations.fijiVrs.enabled) {
    taskClasses.push(VRSActionRetrier);
  }

  if (integrations.signer.enabled) {
    taskClasses.push(SignerWorkingPeriodChecker, SignerRenewalChecker, SignerRenewalSender);
  }

  if (schedules.plannedMoveTimeout.enabled) {
    taskClasses.push(PlannedMoveTimeout);
  }

  if (schedules.staleSyncSessionCleaner.enabled) {
    taskClasses.push(StaleSyncSessionCleaner);
  }

  const reportSchedulers = await getReportSchedulers(context);
  const tasks = [
    ...taskClasses.map(Task => {
      try {
        log.debug(`Starting to initialise scheduled task ${Task.name}`);
        return new Task({
          ...context,
          schedules: {
            ...schedules,
            vrsActionRetrier: { schedule: integrations.fijiVrs.retrySchedule },
          },
        });
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
  const { settings } = context;
  const schedulers = [];
  const scheduledReports = await settings.get('scheduledReports');
  for (const options of scheduledReports) {
    schedulers.push(
      new ReportRequestScheduler(context, { ...options, requestedByUserId: systemUser.id }),
    );
  }
  return schedulers;
}
