import config from 'config';

import { Op } from 'sequelize';
import {
  ICAO_DOCUMENT_TYPES,
  LAB_REQUEST_STATUSES,
  COVID_19_CLEARANCE_CERTIFICATE,
  CERTIFICATE_NOTIFICATION_STATUSES,
} from '@tamanu/constants';
import { log } from 'shared/services/logging';
import { ScheduledTask } from 'shared/tasks';
import { getPatientSurveyResponseAnswer } from 'shared/utils';

export class LabRequestNotificationGenerator extends ScheduledTask {
  constructor({ settings, store }) {
    super(null, log);
    this.settings = settings;
    this.models = store.models;
  }

  getName() {
    return 'LabRequestNotificationGenerator';
  }

  async countQueue() {
    const { CertificateNotification, LabRequest } = this.models;
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
    const { CertificateNotification, Encounter, LabRequest } = this.models;
    const categories = await this.settings.get('notifications.certificates.labTestCategoryIds');
    const questionId = await this.settings.get('questionCodeIds.email');

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
        this.models,
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
