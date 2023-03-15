import config from 'config';
import { JOB_TOPICS } from 'shared/constants';
import { log } from 'shared/services/logging';
import { FhirWorker } from 'shared/tasks';

import { findUser } from '../auth/utils';

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
import { FhirRefreshMissingFromResources } from './FhirRefreshMissingFromResource';

import { FhirRefreshFromUpstream } from './FhirRefreshFromUpstream';
import { FhirRefreshAllFromUpstream } from './FhirRefreshAllFromUpstream';
import { FhirRefreshEntireResource } from './FhirRefreshEntireResource';
import { FhirRefreshResolver } from './FhirRefreshResolver';

export async function startScheduledTasks(context) {
  const taskClasses = [
    OutpatientDischarger,
    DeceasedPatientDischarger,
    PatientEmailCommunicationProcessor,
    ReportRequestProcessor,
    CertificateNotificationProcessor,
    PatientMergeMaintainer,
    FhirRefreshMissingFromResources,
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

export async function startFhirWorkerTasks({ store }) {
  const worker = new FhirWorker(store, log);
  await worker.start();

  worker.setHandler(JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM, FhirRefreshFromUpstream);
  worker.setHandler(JOB_TOPICS.FHIR.REFRESH.ALL_FROM_UPSTREAM, FhirRefreshAllFromUpstream);
  worker.setHandler(JOB_TOPICS.FHIR.REFRESH.ENTIRE_RESOURCE, FhirRefreshEntireResource);
  worker.setHandler(JOB_TOPICS.FHIR.REFRESH.RESOLVER, FhirRefreshResolver);

  worker.processQueueNow();
  return worker;
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
