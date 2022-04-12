import config from 'config';
import { get } from 'lodash';

import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  ICAO_DOCUMENT_TYPES,
  CERTIFICATE_NOTIFICATION_STATUSES,
} from 'shared/constants';
import { log } from 'shared/services/logging';
import { ScheduledTask } from 'shared/tasks';
import { getPatientSurveyResponseAnswer } from 'shared/utils';
import { makeVaccineCertificate, makeCovidTestCertificate } from '../utils/makePatientCertificate';
import { getLocalisation } from '../localisation';
import {
  createProofOfVaccination,
  VdsNcDocument,
  generateUVCIForPatient,
} from '../integrations/VdsNc';

export class CertificateNotificationProcessor extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.certificateNotificationProcessor;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
  }

  getName() {
    return 'CertificateNotificationProcessor';
  }

  async processPublishedLabRequests() {
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

  async run() {
    const { models } = this.context.store;
    const { CertificateNotification, PatientCommunication, Patient } = models;
    const vdsEnabled = config.integrations.vdsNc.enabled;
    const localisation = await getLocalisation();

    await this.processPublishedLabRequests();

    const queuedNotifications = await CertificateNotification.findAll({
      where: {
        status: CERTIFICATE_NOTIFICATION_STATUSES.QUEUED,
      },
      order: [['createdAt', 'ASC']], // process in order received
      limit: this.config.limit,
    });
    if (queuedNotifications.length > 0) {
      log.info(`Starting: ${this.getName()} task with ${queuedNotifications.length} to process`);
    } else {
      return;
    }

    let processed = 0;
    for (const notification of queuedNotifications) {
      try {
        const patientId = notification.get('patientId');
        const patient = await Patient.findByPk(patientId);

        const requireSigning = notification.get('requireSigning');
        const type = notification.get('type');
        const printedBy = notification.get('createdBy');

        log.info(
          `Processing certificate notification: id=${notification.id} patient=${patientId} type=${type} requireSigning=${requireSigning}`,
        );

        let template;
        let vdsData = null;
        let pdf = null;

        switch (type) {
          case ICAO_DOCUMENT_TYPES.PROOF_OF_VACCINATION.JSON:
            template = 'vaccineCertificateEmail';

            if (requireSigning && vdsEnabled) {
              log.debug('Generating VDS data for proof of vaccination');
              const povData = await createProofOfVaccination(patient.id, { models });
              const uniqueProofId = await generateUVCIForPatient(patient.id);
              const vdsDoc = new VdsNcDocument(type, povData, uniqueProofId);
              vdsDoc.models = models;
              await vdsDoc.sign();
              vdsData = await vdsDoc.intoVDS();
            }

            log.debug('Making vax PDF');
            pdf = await makeVaccineCertificate(patient, printedBy, models, vdsData);
            break;

          case ICAO_DOCUMENT_TYPES.PROOF_OF_TESTING.JSON:
            template = 'covidTestCertificateEmail';
            if (false && requireSigning && vdsEnabled) {
              // log.debug('Generating VDS data for proof of testing');
              // const potData = await createProofOfTesting(labTestId ???, { models });
              // const uniqueProofId = await patient.getIcaoUTCI()???;
              // const vdsDoc = new Document(type, potData, uniqueProofId);
              // vdsDoc.models = models;
              // await vdsDoc.sign();
              // vdsData = await vdsDoc.intoVDS();
            }

            log.debug('Making test PDF');
            pdf = await makeCovidTestCertificate(patient, printedBy, models, vdsData);
            break;
          default:
            throw new Error(`Unknown certificate type ${type}`);
        }

        log.debug('Creating communication record');
        // build the email notification
        await PatientCommunication.create({
          type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
          channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
          subject: get(localisation, `templates.${template}.subject`),
          content: get(localisation, `templates.${template}.body`),
          status: COMMUNICATION_STATUSES.QUEUED,
          patientId,
          destination: notification.get('forwardAddress'),
          attachment: pdf.filePath,
        });

        processed += 1;
        await notification.update({
          status: CERTIFICATE_NOTIFICATION_STATUSES.PROCESSED,
        });
      } catch (error) {
        log.error(`Failed to process certificate notification id=${notification.id}: ${error}`);
        await notification.update({
          status: CERTIFICATE_NOTIFICATION_STATUSES.ERROR,
          error: error.message,
        });
      }
    }

    log.info(
      `Done: certificate notification sync-hook task. attempted=${queuedNotifications.length} processed=${processed}`,
    );
  }
}
