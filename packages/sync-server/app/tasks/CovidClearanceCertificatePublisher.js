import config from 'config';

import { subDays, startOfDay } from 'date-fns';
import { Op } from 'sequelize';
import { ScheduledTask } from 'shared/tasks';
import { getPatientSurveyResponseAnswer } from 'shared/utils';
import {
  LAB_REQUEST_STATUSES,
  COVID_19_CLEARANCE_CERTIFICATE,
  CERTIFICATE_NOTIFICATION_STATUSES,
} from 'shared/constants';
import { log } from 'shared/services/logging';

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
    const {
      after,
      labTestCategories,
      labTestTypes,
      daysSinceSampleTime,
      labTestResults = [],
    } = config.schedules.covidClearanceCertificatePublisher;
    const { LabRequest, LabTest, CertificateNotification, Encounter } = this.models;
    const questionId = config.questionCodeIds?.email;

    const labRequestsWhere = {
      status: LAB_REQUEST_STATUSES.PUBLISHED,
      sampleTime: {
        [Op.lt]: subDays(startOfDay(new Date()), daysSinceSampleTime),
        [Op.gt]: after,
      },
      labTestCategoryId: {
        [Op.in]: labTestCategories,
      },
      '$tests.lab_test_type_id$': {
        [Op.in]: labTestTypes,
      },
      '$certificate_notification.id$': null,
    };

    if (labTestResults.length) {
      labRequestsWhere['$tests.result$'] = {
        [Op.in]: labTestResults,
      };
    }

    // Get lab requests that were sampled 13 days before the start
    // of today, and with configured lab test categories
    const clearedRequests = await LabRequest.findAll({
      where: labRequestsWhere,
      include: [
        {
          model: LabTest,
          as: 'tests',
          required: true,
          // We only want to generate clearance notifications for patients who had positive tests
          // Note that LabTest.status is not a used field so we don't need to filter on it
          where: {
            result: 'Positive',
          },
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
