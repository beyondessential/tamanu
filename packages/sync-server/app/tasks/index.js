import { ReportRequestProcessor } from './ReportRequestProcessor';

export function startScheduledTasks(context) {
  const reportProcessor = new ReportRequestProcessor(context);
  reportProcessor.beginPolling();
}
