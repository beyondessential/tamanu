import { TextField } from '/components/TextField/TextField';
import { RadioButtonGroup } from '/components/RadioButtonGroup';
import { DateField } from '/components/DateField/DateField';
import { Dropdown } from '/components/Dropdown';
import { Checkbox } from '/components/Checkbox';
import { NumberField } from '/components/NumberField';

export const FieldTypes = {
  TEXT: 'FreeText',
  MULTILINE: 'Multiline',
  RADIO: 'Radio',
  SELECT: 'Select',
  DATE: 'Date',
  INSTRUCTION: 'Instruction',
  NUMBER: 'Number',
  BINARY: 'Binary',
  CALCULATED: 'Calculated',
  RESULT: 'Result',
};

export const FieldByType = {
  [FieldTypes.TEXT]: TextField,
  [FieldTypes.MULTILINE]: TextField,
  [FieldTypes.RADIO]: RadioButtonGroup,
  [FieldTypes.SELECT]: Dropdown,
  [FieldTypes.DATE]: DateField,
  [FieldTypes.INSTRUCTION]: null,
  [FieldTypes.NUMBER]: NumberField,
  [FieldTypes.BINARY]: Checkbox,
  [FieldTypes.CALCULATED]: null,
  [FieldTypes.RESULT]: null,
};

export function isCalculated(fieldType: string): boolean {
  switch (fieldType) {
    case FieldTypes.CALCULATED:
    case FieldTypes.RESULT:
      return true;
    default:
      return false;
  }
}
