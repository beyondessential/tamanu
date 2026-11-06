import {
  CERTIFICATE_NOTIFICATION_STATUSES,
  IPS_REQUEST_STATUSES,
  JOB_QUEUE_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  REPORT_REQUEST_STATUSES,
} from '@tamanu/constants';

// The work queues whose pending items keep a server awake (see SLPWK#going-to-sleep): report
// requests, FHIR jobs, communications and the notifications and requests that feed them.
//
// Each count lives here so that the scheduled task that drains a queue (its `countQueue`) and the
// api's busy check read the same thing: the api process has no task instances to ask.
//
// Left out on purpose: the cleaners count what has expired, which is housekeeping that never
// needs a server awake, and the time-driven tasks are woken by their schedule instead (see
// SLPWK#scheduled-tasks). A task that is running right now in the tasks process is not visible
// from here either: the tasks process is stopped gracefully before the server sleeps, and
// finishes its running task first.

/** @typedef {Pick<import('../ApplicationContext').ApplicationContext, 'store' | 'settings'>} PendingWorkContext */

/** @param {PendingWorkContext} context */
export const countReceivedReportRequests = ({ store }) =>
  store.models.ReportRequest.count({
    where: { status: REPORT_REQUEST_STATUSES.RECEIVED },
  });

/** @param {PendingWorkContext} context */
export const countQueuedCertificateNotifications = ({ store }) =>
  store.models.CertificateNotification.count({
    where: { status: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED },
  });

/** @param {PendingWorkContext} context */
export const countQueuedIpsRequests = ({ store }) =>
  store.models.IPSRequest.count({
    where: { status: IPS_REQUEST_STATUSES.QUEUED },
  });

/**
 * @param {PendingWorkContext} context
 * @param {string} channel one of PATIENT_COMMUNICATION_CHANNELS
 */
export const countPendingCommunications = async ({ store, settings }, channel) => {
  const retryThreshold = await settings.get('patientCommunication.retryThreshold');
  return store.models.PatientCommunication.countPendingMessages(channel, retryThreshold);
};

/** @param {PendingWorkContext} context */
export const countQueuedFhirJobs = ({ store }) =>
  store.models.FhirJob.count({
    where: { status: JOB_QUEUE_STATUSES.QUEUED },
  });

// keyed by the name of the task that drains the queue (FHIR jobs are drained by the fhir worker)
const PENDING_WORK_COUNTERS = {
  ReportRequestProcessor: countReceivedReportRequests,
  PatientEmailCommunicationProcessor: context =>
    countPendingCommunications(context, PATIENT_COMMUNICATION_CHANNELS.EMAIL),
  PortalCommunicationProcessor: context =>
    countPendingCommunications(context, PATIENT_COMMUNICATION_CHANNELS.PORTAL_EMAIL),
  PatientTelegramCommunicationProcessor: context =>
    countPendingCommunications(context, PATIENT_COMMUNICATION_CHANNELS.TELEGRAM),
  CertificateNotificationProcessor: countQueuedCertificateNotifications,
  IPSRequestProcessor: countQueuedIpsRequests,
  FhirJobs: countQueuedFhirJobs,
};

/**
 * Pending items in each work queue, by name.
 *
 * @param {PendingWorkContext} context
 * @returns {Promise<Record<string, number>>}
 */
export const countPendingWork = async context => {
  const counts = {};
  for (const [name, count] of Object.entries(PENDING_WORK_COUNTERS)) {
    counts[name] = Number(await count(context));
  }
  return counts;
};
