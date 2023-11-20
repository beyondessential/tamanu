import config from 'config';
import path from 'path';
import * as AWS from '@aws-sdk/client-s3';

import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  IPS_REQUEST_STATUSES,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { tmpdir } from '@tamanu/shared/utils';

import { generateIPSBundle } from '../../hl7fhir/materialised/patientSummary/bundleGenerator';
import { QRCodeToFileAsync } from './helpers';

export class IPSRequestProcessor extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.IPSRequestProcessor;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
    // this.subtasks = [new LabRequestNotificationGenerator(context)];
  }

  getName() {
    return 'IPSRequestProcessor';
  }

  async countQueue() {
    return this.context.store.models.IPSRequest.count({
      where: {
        status: IPS_REQUEST_STATUSES.QUEUED,
      },
    });
  }

  async run() {
    const { models } = this.context.store;
    const { FhirPatient, IPSRequest, PatientCommunication, User } = models;

    const queuedNotifications = await IPSRequest.findAll({
      where: {
        status: IPS_REQUEST_STATUSES.QUEUED,
      },
      order: [['createdAt', 'ASC']], // process in order received
      limit: this.config.limit,
    });

    let processed = 0;
    for (const notification of queuedNotifications) {
      try {
        const { patientId, createdBy, email } = notification;

        const [fhirPatient, user] = await Promise.all([
          FhirPatient.findOne({ where: { upstreamId: patientId } }),
          User.findByPk(createdBy),
        ]);

        if (!fhirPatient) {
          throw new Error(`No FHIR patient with patient id ${patientId}`);
        }

        const { patient, bundle: ipsJSON } = await generateIPSBundle(fhirPatient.id, user, models);

        const sublog = log.child({
          id: notification.id,
          patient: patientId,
          fhirPatient: patient.id,
          createdBy,
          email,
        });

        sublog.info('Processing IPS request');

        // SAVE BUNDLE TO S3 HERE

        const now = new Date();

        const {
          region,
          bucketName,
          jsonBucketPath,
          viewerBucketPath,
          publicUrl: s3PublicUrl,
        } = config.s3.ips;

        if (!jsonBucketPath) {
          throw new Error(`jsonBucketPath must be set, e.g. 'au'`);
        }

        const filePath = `${jsonBucketPath}/IPS_${patient.id}_${now.getTime()}.json`;

        try {
          const client = new AWS.S3({ region });
          await client.send(
            new AWS.PutObjectCommand({
              Bucket: bucketName,
              Key: filePath,
              Body: JSON.stringify(ipsJSON),
              ContentType: 'application/json',
            }),
          );
        } catch (err) {
          throw new Error(`There was an error uploading to S3, ${err}`);
        }

        // CREATE PAYLOAD

        const payload = {
          url: `${s3PublicUrl}/${filePath}`,
          key: null,
          flag: 'LU',
          label: `${
            patient.displayName
          } International Patient Summary generated @ ${now.toLocaleString()}`,
        };

        const baseUrl = `${s3PublicUrl}/${viewerBucketPath}`;

        const fullUrl = `${baseUrl}?payload=${btoa(payload)}`;

        // GENERATE QR

        const qrCodeFileName = `International Patient Summary for ${patient.displayName}.png`;
        const folder = await tmpdir();
        const qrCodeFilePath = path.join(folder, qrCodeFileName);

        await QRCodeToFileAsync(qrCodeFilePath, fullUrl);

        // SEND EMAIL

        const content = `
          Please scan the QR code attached to view the International Patient Summary for ${patient.displayName}. \n  Alternatively, use the following link ${fullUrl} \n
          Do not respond to this email.
        `;

        sublog.debug('Creating communication record');
        // build the email notification
        const comm = await PatientCommunication.create({
          type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
          channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
          subject: `International Patient Summary for ${patient.displayName}`,
          content,
          status: COMMUNICATION_STATUSES.QUEUED,
          patientId,
          destination: email,
          attachment: qrCodeFilePath,
        });
        sublog.info('Done processing IPS request', { emailId: comm.id });

        processed += 1;
        await notification.update({
          status: IPS_REQUEST_STATUSES.PROCESSED,
        });
      } catch (error) {
        log.error('Failed to process IPS request', { id: notification.id, error });
        await notification.update({
          status: IPS_REQUEST_STATUSES.ERROR,
          error: error.message,
        });
      }
    }

    log.info('Done with IPS request task', {
      attempted: queuedNotifications.length,
      processed,
    });
  }
}
