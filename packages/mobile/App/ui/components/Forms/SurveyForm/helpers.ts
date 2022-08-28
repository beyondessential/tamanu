import * as Yup from 'yup';

import { AutocompleteSourceToColumnMap } from '~/ui/helpers/constants';
import { getAgeFromDate } from '~/ui/helpers/date';
import { FieldTypes } from '~/ui/helpers/fields';
import { joinNames } from '~/ui/helpers/user';
import { IPatient, ISurveyScreenComponent, IUser } from '~/types';

function getInitialValue(dataElement): JSX.Element {
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

function transformPatientData(patient: IPatient, config): string {
  const { column = 'fullName' } = config;
  const { dateOfBirth, firstName, lastName } = patient;

  switch (column) {
    case 'age':
      return getAgeFromDate(dateOfBirth).toString();
    case 'fullName':
      return joinNames({ firstName, lastName });
    default:
      return patient[column];
  }
}

export function getFormInitialValues(
  components: ISurveyScreenComponent[],
  currentUser: IUser,
  patient: IPatient,
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
      const patientValue = transformPatientData(patient, config);
      if (patientValue !== undefined) initialValues[component.dataElement.code] = patientValue;
    }
  }

  return initialValues;
}

function getFieldValidator(
  dataElement,
): null | Yup.BooleanSchema | Yup.DateSchema | Yup.StringSchema {
  switch (dataElement.type) {
    case FieldTypes.INSTRUCTION:
    case FieldTypes.CALCULATED:
    case FieldTypes.RESULT:
      return undefined;
    case FieldTypes.DATE:
      return Yup.date();
    case FieldTypes.BINARY:
      return Yup.bool();
    case FieldTypes.NUMBER:
    case FieldTypes.TEXT:
    case FieldTypes.MULTILINE:
    default:
      return Yup.string();
  }
}

export function getFormSchema(components: ISurveyScreenComponent[]): Yup.ObjectSchema {
  const objectShapeSchema = components.reduce<{ [key: string]: any }>((acc, component) => {
    const { dataElement, required } = component;
    const propName = dataElement.code;
    const validator = getFieldValidator(dataElement);

    if (!validator) return acc;
    if (required) {
      acc[propName] = validator.required();
    } else {
      acc[propName] = validator.nullable();
    }
    return acc;
  }, {});

  return Yup.object().shape(objectShapeSchema);
}

export async function getAutocompleteDisplayAnswer(
  models,
  dataElementId,
  sourceId,
): Promise<string | null> {
  const autocompleteComponent = await models.SurveyScreenComponent.findOne({
    where: {
      dataElement: dataElementId,
    },
  });
  const autocompleteConfig = autocompleteComponent?.getConfigObject();

  if (autocompleteConfig) {
    const fullLinkedAnswer = await models[autocompleteConfig.source]
      .getRepository()
      .findOne(sourceId);
    const columnToDisplay = AutocompleteSourceToColumnMap[autocompleteConfig.source];
    return fullLinkedAnswer[columnToDisplay];
  }

  return null;
}
