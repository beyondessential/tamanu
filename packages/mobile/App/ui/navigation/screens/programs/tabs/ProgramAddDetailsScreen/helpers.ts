import { FieldTypes } from '/helpers/fields';
import { ProgramModel } from '/models/Program';
import * as Yup from 'yup';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { VerticalPosition } from '/interfaces/VerticalPosition';
import { QuestionModel } from '/models/Question';

function getInitialValue(question) {
  switch(question.type) {
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
  program: ProgramModel,
): { [key: string]: any } {
  const questions = program.questions;

  const initialValues = questions.reduce<{ [key: string]: any }>((acc, question) => {
    const initialValue = getInitialValue(question);
    const propName = question.id;
    if(initialValue === undefined) {
      return acc;
    }
    acc[propName] = initialValue;
    return acc;
  }, {});
  return initialValues;
}

function getFieldValidator(question) {
  switch(question.type) {
    case FieldTypes.INSTRUCTION:
    case FieldTypes.CALCULATED:
    case FieldTypes.RESULT:
      return null;
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

export function getFormSchema(program: ProgramModel): Yup.ObjectSchema {
  const questions = program.questions;
  const objectShapeSchema = questions.reduce<{ [key: string]: any }>(
    (acc, question) => {
      const propName = question.id;
      const validator = getFieldValidator(question);
      if(!validator) return acc;
      if(question.required) {
        acc[propName] = validator.isRequired();
      } else {
        acc[propName] = validator;
      }
      return acc;
    },
    {},
  );
  const schema = Yup.object().shape(objectShapeSchema);
  return schema;
}

export function mapInputVerticalPosition(
  program: ProgramModel,
): VerticalPosition {
  let verticalOffset = 0;
  const verticalPositions = program.questions.reduce<VerticalPosition>(
    (acc, question, questionListIndex) => {
      const normalOffset = screenPercentageToDP(7.04, Orientation.Height);
      const titleOffset = screenPercentageToDP(4.25, Orientation.Height);
      acc[question.id] = {
        x: 0,
        y: verticalOffset + normalOffset,
      };
      verticalOffset += normalOffset;
      if (questionListIndex > 0) {
        verticalOffset += titleOffset;
      }
      return acc;
    },
    {},
  );
  return verticalPositions;
}
