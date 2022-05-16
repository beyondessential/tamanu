import config from 'config';

import { ICAO_DOCUMENT_TYPES, CERTIFICATE_NOTIFICATION_STATUSES } from 'shared/constants';
import { log } from 'shared/services/logging';
import { ScheduledTask } from 'shared/tasks';
import { getPatientSurveyResponseAnswer } from 'shared/utils';

export class PublishedLabRequestCertificateNotificationGenerator extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.certificateNotificationProcessor;
    super(null, log);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'PublishedLabRequestCertificateNotificationGenerator';
  }

  async countQueue() {
    return this.context.store.models.LabRequest.count({
      where: {
        status: 'published',
        '$certificate_notification.id$': null,
      },
    });
  }

  async run() {
    const { models } = this.context.store;
    const { CertificateNotification, Encounter, LabRequest } = models;
    const categories = config.notifications.certificates.labTestCategoryIds;
    const questionId = config.questionCodeIds?.email;

    // Find all published requests that don't have associated certificate notifications
    const newlyPublished = await LabRequest.findAll({
      where: {
        status: 'published',
        '$certificate_notification.id$': null,
      },
      include: [
        {
          model: CertificateNotification,
          as: 'certificate_notification',
          required: false,
        },
        {
          model: Encounter,
          as: 'encounter',
          required: true,
        },
      ],
    });

    // Create a certificate notification for each
    for (const labRequest of newlyPublished) {
      const emailAddress = await getPatientSurveyResponseAnswer(
        models,
        labRequest.encounter.patientId,
        questionId,
      );

      await CertificateNotification.create({
        type: ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON,
        requiresSigning: false,
        patientId: labRequest.encounter.patientId,
        // If forward address is null, the communication service will attempt to use the patient.email field
        forwardAddress: emailAddress,
        // Queue up emails for white listed categories
        status: categories.includes(labRequest.labTestCategoryId)
          ? CERTIFICATE_NOTIFICATION_STATUSES.QUEUED
          : CERTIFICATE_NOTIFICATION_STATUSES.IGNORE,
        labRequestId: labRequest.id,
      });
    }
  }
}
