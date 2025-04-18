import config from 'config';

import { Op } from 'sequelize';
import {
  CERTIFICATE_NOTIFICATION_STATUSES,
  COVID_19_CLEARANCE_CERTIFICATE,
  ICAO_DOCUMENT_TYPES,
  LAB_REQUEST_STATUSES,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { getPatientSurveyResponseAnswer } from '@tamanu/shared/utils';

export class LabRequestNotificationGenerator extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.certificateNotificationProcessor;
    super(null, log);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'LabRequestNotificationGenerator';
  }

  async countQueue() {
    const { CertificateNotification, LabRequest } = this.context.store.models;
    return LabRequest.count({
      where: {
        status: LAB_REQUEST_STATUSES.PUBLISHED,
        '$certificate_notification.id$': null,
      },
      include: [
        {
          model: CertificateNotification,
          as: 'certificate_notification',
          required: false,
          where: {
            type: {
              [Op.ne]: COVID_19_CLEARANCE_CERTIFICATE,
            },
          },
        },
      ],
    });
  }

  async run() {
    const { models } = this.context.store;
    const { CertificateNotification, Encounter, LabRequest } = models;
    const categories = config.notifications.certificates.labTestCategoryIds;
    const questionId = await this.context.settings.get('questionCodeIds.email');

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
        // If forward address is null, the communication service will
        // attempt to use the patient.email field
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
