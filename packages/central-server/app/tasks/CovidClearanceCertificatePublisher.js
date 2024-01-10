import config from 'config';

import { ScheduledTask } from '@tamanu/shared/tasks';
import {
  getPatientSurveyResponseAnswer,
  getCovidClearanceCertificateFilter,
} from '@tamanu/shared/utils';
import {
  COVID_19_CLEARANCE_CERTIFICATE,
  CERTIFICATE_NOTIFICATION_STATUSES,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

export class CovidClearanceCertificatePublisher extends ScheduledTask {
  getName() {
    return 'CovidClearanceCertificatePublisher';
  }

  constructor(context) {
    const { schedule } = config.schedules.covidClearanceCertificatePublisher;
    super(schedule, log);
    this.models = context.store.models;
  }

  async run() {
    const { LabRequest, LabTest, CertificateNotification, Encounter } = this.models;
    const questionId = config.questionCodeIds?.email;

    const labRequestsWhere = {
      ...(await getCovidClearanceCertificateFilter(this.models)),
      '$certificate_notification.id$': null,
    };

    // Get lab requests that were sampled 13 days before the start
    // of today, and with configured lab test categories
    const clearedRequests = await LabRequest.findAll({
      where: labRequestsWhere,
      include: [
        {
          model: LabTest,
          as: 'tests',
          required: true,
        },
        {
          model: CertificateNotification,
          as: 'certificate_notification',
          required: false,
          where: {
            type: COVID_19_CLEARANCE_CERTIFICATE,
            created_by: this.getName(),
          },
        },
        {
          model: Encounter,
          as: 'encounter',
          required: true,
        },
      ],
    });

    for (const labRequest of clearedRequests) {
      const emailAddress = await getPatientSurveyResponseAnswer(
        this.models,
        labRequest.encounter.patientId,
        questionId,
      );

      await CertificateNotification.create({
        type: COVID_19_CLEARANCE_CERTIFICATE,
        createdBy: this.getName(),
        requiresSigning: false,
        patientId: labRequest.encounter.patientId,
        // If forward address is null, the communication service will
        // attempt to use the patient.email field
        forwardAddress: emailAddress,
        status: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED,
        labRequestId: labRequest.id,
      });
    }
  }
}
