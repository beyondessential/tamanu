import * as yup from 'yup';
import { extractDefaults } from './utils';

export const centralSettings = {
  name: 'Central server settings',
  description: 'Settings that apply only the central server',
  values: {
    disk: {
      name: 'Disk',
      description: 'Disk settings',
      values: {
        freeSpaceRequired: {
          name: 'Free space required',
          description: 'Settings related to free disk space required during uploads',
          values: {
            gigabytesForUploadingDocuments: {
              name: 'Gigabytes for uploading documents',
              description: 'The minimum gigabytes required to upload documents',
              schema: yup.number().positive(),
              defaultValue: 16,
            },
          },
        },
      },
    },
  },
};

export const centralDefaults = extractDefaults(centralSettings);
