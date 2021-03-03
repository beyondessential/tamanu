import { ReportRequestProcessor } from './ReportRequestProcessor';

const TASKS = [ReportRequestProcessor];

export function startScheduledTasks(context) {
  const tasks = TASKS.map(Task => new Task(context));
  tasks.forEach(t => t.beginPolling());
  return () => tasks.forEach(t => t.cancelPolling());
}
