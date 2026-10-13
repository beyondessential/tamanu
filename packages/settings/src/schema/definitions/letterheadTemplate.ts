import * as yup from 'yup';
import { SETTING_EDITORS } from '@tamanu/constants';

export const letterheadProperties = {
  title: {
    type: yup.string(),
    defaultValue: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
    editor: SETTING_EDITORS.MULTILINE,
  },
  subTitle: {
    type: yup.string(),
    defaultValue: 'PO Box 12345, Melbourne, Australia',
    editor: SETTING_EDITORS.MULTILINE,
  },
};
