import { FieldTypes } from '/helpers/fields';
import { ProgramModel } from '/models/Program';
import * as Yup from 'yup';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { VerticalPosition } from '/interfaces/VerticalPosition';
import { QuestionModel } from '/models/Question';

export function makeStringCamelCase(string: string): string {
  return string
    .toLocaleLowerCase()
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word: string, index: number) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+/g, '');
}

export function getFormInitialValues(
  program: ProgramModel,
): { [key: string]: any } {
  const questions = program.questions;

  const initialValues = questions.reduce<{ [key: string]: any }>((acc, cur) => {
    cur.list.forEach((question: QuestionModel) => {
      const initialValue =
        question.type === FieldTypes.TEXT ||
        question.type === FieldTypes.MULTILINE
          ? ''
          : null;
      const propName = makeStringCamelCase(question.label);
      acc[propName] = initialValue;
    });
    return acc;
  }, {});
  return initialValues;
}

export function getFormSchema(program: ProgramModel): Yup.ObjectSchema {
  const questions = program.questions;
  const objectShapeSchema = questions.reduce<{ [key: string]: any }>(
    (acc, cur) => {
      cur.list.forEach((question: QuestionModel) => {
        const propName = makeStringCamelCase(question.label);
        const isDateType = question.type === FieldTypes.DATE;
        const yupDateSchema = Yup.date();
        const yupStringSchema = Yup.string();
        if (question.required) {
          acc[propName] = isDateType
            ? yupDateSchema.required()
            : yupStringSchema.required();
        } else {
          acc[propName] = isDateType ? yupDateSchema : yupStringSchema;
        }
      });
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
    (acc, cur, questionListIndex) => {
      const normalOffset = screenPercentageToDP(7.04, Orientation.Height);
      const titleOffset = screenPercentageToDP(4.25, Orientation.Height);
      cur.list.forEach(question => {
        acc[question.id] = {
          x: 0,
          y: verticalOffset + normalOffset,
        };
        verticalOffset += normalOffset;
      });
      if (questionListIndex > 0) {
        verticalOffset += titleOffset;
      }
      return acc;
    },
    {},
  );
  return verticalPositions;
}
