import { TextField } from '/components/TextField/TextField';
import { RadioButtonGroup } from '/components/RadioButtonGroup';
import { DateField } from '/components/DateField/DateField';
import { Dropdown } from '/components/Dropdown';

export const FieldTypes = {
  TEXT: 'text',
  RADIO: 'radio',
  DATE: 'date',
  SELECT: 'select',
  MULTILINE: 'multiline-text',
};

export const FieldByType = {
  [FieldTypes.TEXT]: TextField,
  [FieldTypes.RADIO]: RadioButtonGroup,
  [FieldTypes.SELECT]: Dropdown,
  [FieldTypes.DATE]: DateField,
  [FieldTypes.MULTILINE]: TextField,
};
