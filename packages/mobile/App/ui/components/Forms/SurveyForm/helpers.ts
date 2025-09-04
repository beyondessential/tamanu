// Much of this file is duplicated in `packages/web/app/utils/survey.js`
import * as Yup from 'yup';

import { getAgeFromDate, getAgeWithMonthsFromDate } from '~/ui/helpers/date';
import { getPatientDataDbLocation, checkMandatory, FieldTypes } from '~/ui/helpers/fields';
import { joinNames } from '~/ui/helpers/user';
import {
  IPatient,
  IPatientAdditionalData,
  ISurveyScreenComponent,
  IUser,
  SurveyScreenValidationCriteria,
} from '~/types';
import { IPatientProgramRegistration } from '~/types/IPatientProgramRegistration';
import { GetTranslationFunction } from '~/ui/contexts/TranslationContext';
import { CustomPatientFieldValues } from '~/ui/hooks/usePatientAdditionalData';
import { READONLY_DATA_FIELDS } from '@tamanu/constants';

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
  patientProgramRegistration: IPatientProgramRegistration | null,
  customPatientFieldValues: CustomPatientFieldValues | null,
  config,
): string | undefined | null {
  const { column = 'fullName' } = config;
  const { dateOfBirth, firstName, lastName } = patient;

  switch (column) {
    case READONLY_DATA_FIELDS.AGE:
      return getAgeFromDate(dateOfBirth).toString();
    case READONLY_DATA_FIELDS.AGE_WITH_MONTHS:
      return getAgeWithMonthsFromDate(dateOfBirth);
    case READONLY_DATA_FIELDS.FULL_NAME:
      return joinNames({ firstName, lastName });
    default: {
      const { modelName, fieldName } = getPatientDataDbLocation(column);
      switch (modelName) {
        case 'Patient':
          return patient[fieldName];
        case 'PatientAdditionalData':
          return additionalData ? additionalData[fieldName] : undefined;
        case 'PatientProgramRegistration':
          return patientProgramRegistration ? patientProgramRegistration[fieldName] : undefined;
        default:
          if (customPatientFieldValues?.[column]) {
            return customPatientFieldValues[column][0].value;
          }
          return undefined;
      }
    }
  }
}

export function getFormInitialValues(
  components: ISurveyScreenComponent[],
  currentUser: IUser,
  patient: IPatient,
  patientAdditionalData: IPatientAdditionalData,
  patientProgramRegistration: IPatientProgramRegistration,
  customPatientFieldValues: CustomPatientFieldValues,
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
      const patientValue = transformPatientData(
        patient,
        patientAdditionalData,
        patientProgramRegistration,
        customPatientFieldValues,
        config,
      );
      if (patientValue !== undefined) initialValues[component.dataElement.code] = patientValue;
    }
  }

  return initialValues;
}

function getFieldValidator(
  dataElement,
  validationCriteria: SurveyScreenValidationCriteria,
  getTranslation: GetTranslationFunction,
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
        numberSchema = numberSchema.min(
          min,
          getTranslation('validation.rule.outsideRange', 'Outside acceptable range'),
        );
      }
      if (typeof max === 'number' && !Number.isNaN(max)) {
        numberSchema = numberSchema.max(
          max,
          getTranslation('validation.rule.outsideRange', 'Outside acceptable range'),
        );
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
  getTranslation: GetTranslationFunction,
): Yup.ObjectSchema<any> {
  const objectShapeSchema = components.reduce<{ [key: string]: any }>((acc, component) => {
    const { dataElement } = component;
    const propName = dataElement.code;
    const validationCriteria = component.getValidationCriteriaObject();
    const validator = getFieldValidator(dataElement, validationCriteria, getTranslation);

    if (!validator) return acc;
    const mandatory = checkMandatory(validationCriteria.mandatory, valuesToCheckMandatory);
    if (mandatory) {
      acc[propName] = validator.required(getTranslation('validation.required.inline', '*Required'));
    } else {
      acc[propName] = validator.nullable();
    }
    return acc;
  }, {});

  return Yup.object().shape(objectShapeSchema);
}
