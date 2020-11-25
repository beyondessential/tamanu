import { FieldTypes } from './fields';

import { TextField } from '~/ui/components/TextField/TextField';
import { RadioButtonGroup } from '~/ui/components/RadioButtonGroup';
import { DateField } from '~/ui/components/DateField/DateField';
import { Dropdown } from '~/ui/components/Dropdown';
import { Checkbox } from '~/ui/components/Checkbox';
import { NumberField } from '~/ui/components/NumberField';

export const FieldByType = {
  [FieldTypes.TEXT]: TextField,
  [FieldTypes.MULTILINE]: TextField,
  [FieldTypes.RADIO]: RadioButtonGroup,
  [FieldTypes.SELECT]: Dropdown,
  [FieldTypes.DATE]: DateField,
  [FieldTypes.SUBMISSION_DATE]: DateField,
  [FieldTypes.INSTRUCTION]: null,
  [FieldTypes.NUMBER]: NumberField,
  [FieldTypes.BINARY]: Checkbox,
  [FieldTypes.CHECKBOX]: Checkbox,
  [FieldTypes.CALCULATED]: null,
  [FieldTypes.RESULT]: null,
};
