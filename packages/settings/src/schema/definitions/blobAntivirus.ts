import * as yup from 'yup';
import { BLOB_SCANNERS, BLOB_SCANNERS_VALUES } from '@tamanu/constants';

import type { Setting, SettingsSchema } from '../../types';
import { msDurationSchema } from './msDuration';

// spec: AV
// Left at none, the feature is inert. The serve policy is deployment-wide and lives in the global
// scope.
export const blobAntivirusProperties = (): Record<string, Setting | SettingsSchema> => ({
  antivirus: {
    name: 'Antivirus',
    description: 'Malware scanning of blobs held by this server',
    properties: {
      scanner: {
        name: 'Scanner',
        description: 'The host scanner this server drives, or none to leave content unscanned',
        type: yup.string().oneOf(BLOB_SCANNERS_VALUES),
        defaultValue: BLOB_SCANNERS.NONE,
        options: [
          { value: BLOB_SCANNERS.NONE, label: 'None' },
          { value: BLOB_SCANNERS.CLAMD, label: 'ClamAV (clamd)' },
        ],
      },
      address: {
        name: 'Scanner address',
        description:
          'Where the scanner listens: an absolute path for a unix socket, or host:port for TCP',
        type: yup.string(),
        defaultValue: '/var/run/clamav/clamd.ctl',
      },
      timeout: {
        name: 'Scan timeout',
        description:
          'How long one blob may take to scan before the scanner is treated as unavailable and the content left unscanned',
        type: msDurationSchema,
        defaultValue: '60s',
      },
      maxScanMB: {
        name: 'Largest scannable blob',
        description:
          'Blobs above this size are left unscanned rather than sent to the scanner, so a scanner stream limit does not stall the pass. Keep it at or below the scanner’s own limit (clamd’s StreamMaxLength defaults to 25MB). What an unscanned blob does is the serve policy’s decision',
        type: yup.number().positive(),
        defaultValue: 25,
        unit: 'MB',
      },
    },
  },
});

// spec: AV
// Separate from the scrub's bounds: scanning is bound by scanner throughput, and a signature update
// makes the whole store due at once.
export const blobScanProperties = (): Record<string, Setting> => ({
  maxBlobsPerPass: {
    name: 'Blobs per pass',
    description:
      'Most blobs one scan pass sends to the scanner. Together with the schedule this sets how quickly newly admitted content is scanned, and how long a re-scan of the whole store takes after a signature update',
    type: yup.number().integer().positive(),
    defaultValue: 200,
  },
  maxGigabytesPerPass: {
    name: 'Gigabytes per pass',
    description:
      'Most content one scan pass sends to the scanner, which is what keeps a re-scan of the whole store from monopolising it',
    type: yup.number().positive(),
    defaultValue: 2,
    unit: 'GB',
  },
});
