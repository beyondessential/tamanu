import config from 'config';
import path from 'path';
import * as jose from 'jose';
import * as AWS from '@aws-sdk/client-s3';
import { base64UrlEncode } from '@tamanu/shared/utils/encodings';

import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
  IPS_REQUEST_STATUSES,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { ScheduledTask } from '@tamanu/shared/tasks';
import { tmpdir } from '@tamanu/shared/utils';

import { getRandomBase64String } from '../../auth/utils';
import { generateIPSBundle } from '../../hl7fhir/materialised/patientSummary/bundleGenerator';
import { QRCodeToFileAsync } from './helpers';

// SHL flag reference: https://docs.smarthealthit.org/smart-health-links/spec/#construct-a-shlink-payload
const SHL_FLAG_LONGTERM = 'L';
const SHL_FLAG_SINGLEFILE = 'U';

export class IPSRequestProcessor extends ScheduledTask {
  constructor(context) {
    const conf = config.schedules.IPSRequestProcessor;
    super(conf.schedule, log);
    this.config = conf;
    this.context = context;
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

        const filePath = `${jsonBucketPath}/${await getRandomBase64String(
          32,
          'base64url',
        )}_manifest`;

        // CREATE PAYLOAD

        const payload = {
          url: `${s3PublicUrl}/${filePath}`,
          key: await getRandomBase64String(32, 'base64url'),
          flag: `${SHL_FLAG_LONGTERM}${SHL_FLAG_SINGLEFILE}`,
          label: `${
            patient.displayName
          } International Patient Summary generated @ ${now.toLocaleString()}`,
        };

        // ENCRYPT IPS BUNDLE

        const encrypted = await new jose.CompactEncrypt(
          new TextEncoder().encode(JSON.stringify(ipsJSON)),
        )
          .setProtectedHeader({
            alg: 'dir',
            enc: 'A256GCM',
            cty: 'application/fhir+json',
          })
          .encrypt(jose.base64url.decode(payload.key));

        // SAVE BUNDLE TO S3

        try {
          const client = new AWS.S3({ region });
          await client.send(
            new AWS.PutObjectCommand({
              Bucket: bucketName,
              Key: filePath,
              Body: encrypted,
              ContentType: 'application/jose',
            }),
          );
        } catch (err) {
          throw new Error(`There was an error uploading to S3, ${err}`);
        }

        const baseUrl = `${s3PublicUrl}/${viewerBucketPath}`;

        const fullUrl = `${baseUrl}#shlink:/${base64UrlEncode(JSON.stringify(payload))}`;

        // GENERATE QR

        const qrCodeFileName = `International Patient Summary for ${patient.displayName}.png`;
        const folder = await tmpdir();
        const qrCodeFilePath = path.join(folder, qrCodeFileName);

        await QRCodeToFileAsync(qrCodeFilePath, fullUrl, { type: 'png' });

        // SEND EMAIL

        const { subject, bodyText } = config.integrations.ips.email;

        const content = `
          ${bodyText} \n  Alternatively, use the following link ${fullUrl} \n
          Do not respond to this email.
        `;

        sublog.debug('Creating communication record');
        // build the email notification
        const comm = await PatientCommunication.create({
          type: PATIENT_COMMUNICATION_TYPES.CERTIFICATE,
          channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
          subject,
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
