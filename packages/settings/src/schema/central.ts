import * as yup from 'yup';
import { extractDefaults } from './utils';

export const centralSettings = {
  disk: {
    freeSpaceRequired: {
      gigabytesForUploadingDocuments: {
        name: 'Gigabytes for uploading documents',
        description: 'The minimum gigabytes required to upload documents',
        schema: yup.number().required(),
        defaultValue: 16,
      },
    },
  },
};

export const centralDefaults = extractDefaults(centralSettings);
