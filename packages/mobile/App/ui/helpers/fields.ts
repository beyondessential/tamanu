import { TextField } from '/components/TextField/TextField';
import { RadioButtonGroup } from '/components/RadioButtonGroup';
import { DateField } from '/components/DateField/DateField';
import { Dropdown } from '/components/Dropdown';

export const FieldTypes = {
  TEXT: 'text',
  MULTILINE: 'multiline-text',
  RADIO: 'radio',
  SELECT: 'select',
  DATE: 'date',
  INSTRUCTION: 'instruction',
  NUMBER: 'number',
  BINARY: 'binary',
  CALCULATED: 'calculated',
  RESULT: 'result',
};

export const FieldByType = {
  [FieldTypes.TEXT]: TextField,
  [FieldTypes.MULTILINE]: TextField,
  [FieldTypes.RADIO]: RadioButtonGroup,
  [FieldTypes.SELECT]: Dropdown,
  [FieldTypes.DATE]: DateField,
  [FieldTypes.INSTRUCTION]: null,
  [FieldTypes.NUMBER]: TextField,
  [FieldTypes.BINARY]: TextField,
  [FieldTypes.CALCULATED]: TextField,
  [FieldTypes.RESULT]: TextField,
};
