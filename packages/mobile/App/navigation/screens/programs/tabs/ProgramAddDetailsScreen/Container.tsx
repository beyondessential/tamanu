import React, { useMemo, useRef, useCallback, ReactElement, FC } from 'react';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { ProgramModel } from '/models/Program';
import { FieldTypes, FieldByType } from '/helpers/fields';
import * as Yup from 'yup';
import { StyledView } from '/styled/common';
import { Field } from '/components/Forms/FormField';
import { SectionHeader } from '/components/SectionHeader';
import { QuestionModel } from '/models/Question';
import { Screen } from './Screen';

type ProgramAddDetailsScreenParams = {
  ProgramAddDetailsScreen: {
    program: ProgramModel;
  };
};

type ProgramAddDetailsScreenRouteProps = RouteProp<
  ProgramAddDetailsScreenParams,
  'ProgramAddDetailsScreen'
>;

type ProgramAddDetailsScreenProps = {
  navigation: NavigationProp<any>;
  route: ProgramAddDetailsScreenRouteProps;
};

function makeStringCamelCase(string: string): string {
  return string
    .toLocaleLowerCase()
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word: string, index: number) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+/g, '');
}

export interface AddDetailsFormFieldsProps {
  program: ProgramModel;
  scrollTo: (item: { x: number; y: number }) => void;
  verticalPositions: VerticalPosition;
}

const FormFields = ({
  program,
  scrollTo,
  verticalPositions,
}: AddDetailsFormFieldsProps): ReactElement => (
  <React.Fragment>
    {program.questions.map(questionList => {
      const fields = questionList.list.map(question => {
        const fieldInput: FC<any> = FieldByType[question.type];
        const isMultiline = question.type === FieldTypes.MULTILINE;
        console.log(verticalPositions[question.id]);
        return (
          <StyledView marginTop={10}>
            <Field
              key={question.id}
              onFocus={() => scrollTo(verticalPositions[question.id])}
              component={fieldInput}
              name={makeStringCamelCase(question.label)}
              options={question.options}
              multiline={isMultiline}
              label={question.label}
            />
          </StyledView>
        );
      });
      return (
        <React.Fragment>
          <SectionHeader marginTop={20} h3>
            {questionList.title}
          </SectionHeader>
          {fields}
        </React.Fragment>
      );
    })}
  </React.Fragment>
);

function getFormInitialValues(program: ProgramModel): { [key: string]: any } {
  const questions = program.questions;

  const initialValues = questions.reduce<{ [key: string]: any }>((acc, cur) => {
    cur.list.forEach((question: QuestionModel) => {
      const initialValue =
        question.type === 'text' || question.type === 'multiline-text'
          ? ''
          : null;
      const propName = makeStringCamelCase(question.label);
      acc[propName] = initialValue;
    });
    return acc;
  }, {});
  return initialValues;
}

function getFormSchema(program: ProgramModel): Yup.ObjectSchema {
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

export interface VerticalPosition {
  [key: number]: {
    x: number;
    y: number;
  };
  [key: string]: {
    x: number;
    y: number;
  };
}

function mapInputVerticalPosition(program: ProgramModel): VerticalPosition {
  let verticalOffset = 0;
  const verticalPositions = program.questions.reduce<VerticalPosition>(
    (acc, cur) => {
      const normalOffset = screenPercentageToDP(7.04, Orientation.Height);
      const titleOffset = screenPercentageToDP(4.25, Orientation.Height);
      cur.list.forEach((question, questionIndex) => {
        const isLast = questionIndex === cur.list.length - 1;
        if (!isLast) {
          acc[question.id] = {
            x: 0,
            y:
              cur.list[questionIndex + 1].type === FieldTypes.RADIO
                ? verticalOffset + normalOffset * 2
                : verticalOffset + normalOffset,
          };
          verticalOffset += normalOffset;
        } else {
          acc[question.id] = {
            x: 0,
            y: verticalOffset + normalOffset,
          };
          verticalOffset += normalOffset;
        }
      });
      verticalOffset += titleOffset;
      return acc;
    },
    {},
  );
  console.log(verticalPositions);
  return verticalPositions;
}

export const Container = ({
  route,
}: ProgramAddDetailsScreenProps): ReactElement => {
  const { program } = route.params;
  const initialValues = useMemo(() => getFormInitialValues(program), [program]);
  const formValidationSchema = useMemo(() => getFormSchema(program), [program]);
  const containerScrollView = useRef<any>(null);
  const verticalPositions = useMemo(() => mapInputVerticalPosition(program), [
    program,
  ]);
  const scrollTo = useCallback(
    (verticalPosition: { x: number; y: number }) => {
      if (containerScrollView) {
        containerScrollView.current.scrollTo(verticalPosition);
      }
    },
    [containerScrollView],
  );

  return (
    <Screen
      FormFields={FormFields}
      program={program}
      verticalPositions={verticalPositions}
      containerScrollView={containerScrollView}
      formValidationSchema={formValidationSchema}
      initialValues={initialValues}
      scrollTo={scrollTo}
    />
  );
};
