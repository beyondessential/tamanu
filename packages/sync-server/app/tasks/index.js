import config from 'config';

import { OutpatientDischarger } from './OutpatientDischarger';
import { PatientEmailCommunicationProcessor } from './PatientEmailCommunicationProcessor';
import { ReportRequestProcessor } from './ReportRequestProcessor';
import { ReportRequestScheduler } from './ReportRequestScheduler';
import { VRSActionRetrier } from './VRSActionRetrier';

export async function startScheduledTasks(context) {
  const taskClasses = [
    OutpatientDischarger,
    ReportRequestProcessor,
    PatientEmailCommunicationProcessor,
  ];
  if (config.integrations.fijiVrs.enabled) {
    taskClasses.push(VRSActionRetrier);
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
