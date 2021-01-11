import { ISurveyScreenComponent } from '~/types/ISurvey';

export const FieldTypes = {
  TEXT: 'FreeText',
  MULTILINE: 'Multiline',
  RADIO: 'Radio',
  SELECT: 'Select',
  DATE: 'Date',
  SUBMISSION_DATE: 'SubmissionDate',
  INSTRUCTION: 'Instruction',
  NUMBER: 'Number',
  BINARY: 'Binary',
  CHECKBOX: 'Checkbox',
  CALCULATED: 'CalculatedQuestion',
  CONDITION: 'ConditionQuestion',
  RESULT: 'Result',
};

export const getStringValue = (type: string, value: any): string  => {
  switch(type) {
    case FieldTypes.TEXT:
    case FieldTypes.MULTILINE:
      return value;
    case FieldTypes.DATE:
    case FieldTypes.SUBMISSION_DATE:
      return value && value.toISOString();
    case FieldTypes.BINARY:
    case FieldTypes.CHECKBOX:
      if(typeof value === 'string') return value;
      // booleans should all be stored as Yes/No to match meditrak
      return value ? "Yes" : "No";
    default:
      return `${value}`;
  }
}

export function isCalculated(fieldType: string): boolean {
  switch (fieldType) {
    case FieldTypes.CALCULATED:
    case FieldTypes.RESULT:
      return true;
    default:
      return false;
  }
}

interface DropdownOption {
  label: string;
  value: any;
}

// Takes an object and returns the key:value pairs as options for dropdown fields.
export function createDropdownOptionsFromObject(o): DropdownOption[] {
  return Object.entries(o).map(([key, value]) => ({ label: key, value }));
}

interface ResultValue {
  result: number;
  resultText: string;
}

function formatResultText(value: number, { options }: ISurveyScreenComponent): string {
  // as percentage
  return `${value.toFixed(0)}%`;
}

export function getResultValue(component: ISurveyScreenComponent, values: {}): ResultValue {
  if(!component) {
    // this survey does not have a result field
    return { result: 0, resultText: '' };
  }

  const rawValue = values[component.dataElement.code];

  if(typeof(rawValue) === "string") {
    return { result: 0, resultText: rawValue };
  }

  // handling numeric data
  return { 
    result: rawValue,
    resultText: formatResultText(rawValue, component),
  };
}
