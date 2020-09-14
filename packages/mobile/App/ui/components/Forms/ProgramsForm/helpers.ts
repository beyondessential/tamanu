import { FieldTypes } from '/helpers/fields';
import { ISurveyScreenComponent } from '~/types';
import * as Yup from 'yup';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { VerticalPosition } from '/interfaces/VerticalPosition';

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

export function getFormInitialValues(
  components: ISurveyScreenComponent[],
): { [key: string]: any } {
  const initialValues = components.reduce<{ [key: string]: any }>(
    (acc, { dataElement }) => {
      const initialValue = getInitialValue(dataElement);
      const propName = dataElement.id;
      if (initialValue === undefined) {
        return acc;
      }
      acc[propName] = initialValue;
      return acc;
    },
    {},
  );
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

export function getFormSchema(
  components: ISurveyScreenComponent[],
): Yup.ObjectSchema {
  const objectShapeSchema = components.reduce<{ [key: string]: any }>(
    (acc, component) => {
      const { dataElement, required } = component;
      const propName = dataElement.id;
      const validator = getFieldValidator(dataElement);
      if (!validator) return acc;
      if (required) {
        acc[propName] = validator.required();
      } else {
        acc[propName] = validator;
      }
      return acc;
    },
    {},
  );
  return Yup.object().shape(objectShapeSchema);
}

export function mapInputVerticalPosition(
  components: ISurveyScreenComponent[],
): VerticalPosition {
  let verticalOffset = 0;
  const verticalPositions = components.reduce<VerticalPosition>(
    (acc, component, componentIndex) => {
      const normalOffset = screenPercentageToDP(7.04, Orientation.Height);
      const titleOffset = screenPercentageToDP(4.25, Orientation.Height);
      acc[component.id] = {
        x: 0,
        y: verticalOffset + normalOffset,
      };
      verticalOffset += normalOffset;
      if (componentIndex > 0) {
        verticalOffset += titleOffset;
      }
      return acc;
    },
    {},
  );
  return verticalPositions;
}
