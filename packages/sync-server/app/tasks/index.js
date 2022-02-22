import config from 'config';
import { vdsConfig } from '../integrations/VdsNc';

import { PatientEmailCommunicationProcessor } from './PatientEmailCommunicationProcessor';
import { OutpatientDischarger } from './OutpatientDischarger';
import { ReportRequestProcessor } from './ReportRequestProcessor';
import { ReportRequestScheduler } from './ReportRequestScheduler';
import { VRSActionRetrier } from './VRSActionRetrier';
import { VdsNcSignerExpiryChecker } from './VdsNcSignerExpiryChecker';
import { VdsNcSignerRenewalChecker } from './VdsNcSignerRenewalChecker';
import { VdsNcSignerRenewalSender } from './VdsNcSignerRenewalSender';
import { VdsNcDocumentSigningProcessor } from './VdsNcDocumentSigningProcessor';

export async function startScheduledTasks(context) {
  const taskClasses = [
    OutpatientDischarger,
    PatientEmailCommunicationProcessor,
    ReportRequestProcessor,
  ];
  if (config.integrations.fijiVrs.enabled) {
    taskClasses.push(VRSActionRetrier);
  }
  if (vdsConfig().enabled) {
    taskClasses.push(
      VdsNcDocumentSigningProcessor,
      VdsNcSignerExpiryChecker,
      VdsNcSignerRenewalChecker,
      VdsNcSignerRenewalSender,
    );
  }

  const reportSchedulers = await getReportSchedulers(context);
  const tasks = [...taskClasses.map(Task => new Task(context)), ...reportSchedulers];
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
