import config from 'config';
import { findUser } from '../auth/utils';
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

  const reportSchedulers = await getReportSchedulers(context);
  const tasks = [...taskClasses.map(Task => new Task(context)), ...reportSchedulers];
  tasks.forEach(t => t.beginPolling());
  return () => tasks.forEach(t => t.cancelPolling());
}

async function getReportSchedulers(context) {
  const initialUser = await findUser(context.store.models, config.auth.initialUser.email);

  const schedulers = [];
  for (const options of config.scheduledReports) {
    schedulers.push(
      new ReportRequestScheduler(context, { ...options, requestedByUserId: initialUser.id }),
    );
  }
  return schedulers;
}
