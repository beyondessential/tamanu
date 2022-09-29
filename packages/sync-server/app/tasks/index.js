import config from 'config';
import { log } from 'shared/services/logging';

import { PatientEmailCommunicationProcessor } from './PatientEmailCommunicationProcessor';
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
import { DuplicateAdditionalDataDeleter } from './DuplicateAdditionalDataDeleter';
import { CovidClearanceCertificatePublisher } from './CovidClearanceCertificatePublisher';
import { FhirMaterialiser } from './FhirMaterialiser';

export async function startScheduledTasks(context) {
  const taskClasses = [
    OutpatientDischarger,
    DeceasedPatientDischarger,
    PatientEmailCommunicationProcessor,
    ReportRequestProcessor,
    CertificateNotificationProcessor,
  ];

  if (config.schedules.automaticLabTestResultPublisher.enabled) {
    taskClasses.push(AutomaticLabTestResultPublisher);
  }

  if (config.schedules.duplicateAdditionalDataDeleter.enabled) {
    taskClasses.push(DuplicateAdditionalDataDeleter);
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

  if (config.integrations.fhir.enabled && config.schedules.fhirMaterialiser.enabled) {
    taskClasses.push(FhirMaterialiser);
  }

  const reportSchedulers = await getReportSchedulers(context);
  const tasks = [...taskClasses.map(Task => {
    try {
      log.debug(`Starting to initialise scheduled task ${Task.name}`);
      return new Task(context);
    } catch (err) {
      log.warn('Failed to initialise scheduled task',
       { name: Task.name,  err }
      );
      return null;
    }
  }), ...reportSchedulers].filter(x => x);
  tasks.forEach(t => t.beginPolling());
  return () => tasks.forEach(t => t.cancelPolling());
}

async function getReportSchedulers(context) {
  const initialUser = await context.store.findUser(config.auth.initialUser.email);

  const schedulers = [];
  for (const options of config.scheduledReports) {
    schedulers.push(
      new ReportRequestScheduler(context, { ...options, requestedByUserId: initialUser.id }),
    );
  }
  return schedulers;
}
