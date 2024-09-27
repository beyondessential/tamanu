import * as yup from 'yup';

export const letterheadProperties = {
  title: {
    type: yup.string(),
    defaultValue: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  },
  subTitle: { type: yup.string(), defaultValue: 'PO Box 12345, Melbourne, Australia' },
};
