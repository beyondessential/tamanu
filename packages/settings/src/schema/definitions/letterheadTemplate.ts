import * as yup from 'yup';

export const letterheadProperties = {
  letterhead: {
    description: 'The text at the top of most patient PDFs',
    properties: {
      title: {
        type: yup.string(),
        defaultValue: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
      },
      subTitle: { type: yup.string(), defaultValue: 'PO Box 12345, Melbourne, Australia' },
    },
  },
};
