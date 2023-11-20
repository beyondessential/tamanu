// Much of this file is duplicated in `packages/desktop/app/utils/survey.js`
import * as Yup from 'yup';

import { getAgeFromDate, getAgeWithMonthsFromDate } from '~/ui/helpers/date';
import { FieldTypes, checkMandatory } from '~/ui/helpers/fields';
import { joinNames } from '~/ui/helpers/user';
import {
  IPatient,
  ISurveyScreenComponent,
  IUser,
  SurveyScreenValidationCriteria,
  IPatientAdditionalData,
} from '~/types';

function getInitialValue(dataElement): string {
  switch (dataElement.type) {
    case FieldTypes.TEXT:
    case FieldTypes.MULTILINE:
    case FieldTypes.NUMBER:
      return '';
    case FieldTypes.DATE:
    default:
      return undefined;
  }
}

function transformPatientData(
  patient: IPatient,
  additionalData: IPatientAdditionalData | null,
  config,
): string | undefined | null {
  const { writeToPatient = {}, column = 'fullName' } = config;
  const { isAdditionalDataField = false } = writeToPatient;
  const { dateOfBirth, firstName, lastName } = patient;

  switch (column) {
    case 'age':
      return getAgeFromDate(dateOfBirth).toString();
    case 'ageWithMonths':
      return getAgeWithMonthsFromDate(dateOfBirth);
    case 'fullName':
      return joinNames({ firstName, lastName });
    default:
      if (isAdditionalDataField) {
        return additionalData ? additionalData[column] : undefined;
      }
      return patient[column];
  }
}

export function getFormInitialValues(
  components: ISurveyScreenComponent[],
  currentUser: IUser,
  patient: IPatient,
  patientAdditionalData: IPatientAdditionalData,
): { [key: string]: any } {
  const initialValues = components.reduce<{ [key: string]: any }>((acc, { dataElement }) => {
    const initialValue = getInitialValue(dataElement);
    const propName = dataElement.code;
    if (initialValue === undefined) {
      return acc;
    }
    acc[propName] = initialValue;
    return acc;
  }, {});

  // other data
  for (const component of components) {
    // type definition of config is string, but in usage its an object...
    const config = component.getConfigObject();

    // current user data
    if (component.dataElement.type === 'UserData') {
      const { column = 'displayName' } = config;
      const userValue = currentUser[column];
      if (userValue !== undefined) initialValues[component.dataElement.code] = userValue;
    }

    // patient data
    if (component.dataElement.type === 'PatientData') {
      const patientValue = transformPatientData(patient, patientAdditionalData, config);
      if (patientValue !== undefined) initialValues[component.dataElement.code] = patientValue;
    }
  }

  return initialValues;
}

function getFieldValidator(
  dataElement,
  validationCriteria: SurveyScreenValidationCriteria,
): null | Yup.BooleanSchema | Yup.DateSchema | Yup.StringSchema | Yup.NumberSchema {
  switch (dataElement.type) {
    case FieldTypes.INSTRUCTION:
    case FieldTypes.CALCULATED:
    case FieldTypes.RESULT:
      return undefined;
    case FieldTypes.DATE:
      return Yup.date();
    case FieldTypes.BINARY:
      return Yup.bool();
    case FieldTypes.NUMBER: {
      const { min, max } = validationCriteria;
      let numberSchema = Yup.number();
      if (typeof min === 'number' && !Number.isNaN(min)) {
        numberSchema = numberSchema.min(min, 'Outside accepted range');
      }
      if (typeof max === 'number' && !Number.isNaN(max)) {
        numberSchema = numberSchema.max(max, 'Outside accepted range');
      }
      return numberSchema;
    }

    case FieldTypes.TEXT:
    case FieldTypes.MULTILINE:
    default:
      return Yup.string();
  }
}

export function getFormSchema(
  components: ISurveyScreenComponent[],
  valuesToCheckMandatory: { [key: string]: any } = {},
): Yup.ObjectSchema {
  const objectShapeSchema = components.reduce<{ [key: string]: any }>((acc, component) => {
    const { dataElement } = component;
    const propName = dataElement.code;
    const validationCriteria = component.getValidationCriteriaObject();
    const validator = getFieldValidator(dataElement, validationCriteria);

    if (!validator) return acc;
    const mandatory = checkMandatory(validationCriteria.mandatory, valuesToCheckMandatory);
    if (mandatory) {
      acc[propName] = validator.required('Required');
    } else {
      acc[propName] = validator.nullable();
    }
    return acc;
  }, {});

  return Yup.object().shape(objectShapeSchema);
}
