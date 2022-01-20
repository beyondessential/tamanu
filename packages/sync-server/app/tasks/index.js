import config from 'config';

import { PatientEmailCommunicationProcessor } from './PatientEmailCommunicationProcessor';
import { OutpatientDischarger } from './OutpatientDischarger';
import { ReportRequestProcessor } from './ReportRequestProcessor';
import { ReportRequestScheduler } from './ReportRequestScheduler';
import { VdsNcSignerRenewalChecker } from './VdsNcSignerRenewalChecker';
import { VdsNcSignatureRequestProcessor } from './VdsNcSignatureRequestProcessor';

const TASKS = [
  OutpatientDischarger,
  PatientEmailCommunicationProcessor,
  ReportRequestProcessor,
  VdsNcSignatureRequestProcessor,
  VdsNcSignerRenewalChecker,
];

export async function startScheduledTasks(context) {
  const reportSchedulers = await getReportSchedulers(context);
  const tasks = [...TASKS.map(Task => new Task(context)), ...reportSchedulers];
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
