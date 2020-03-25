import React, { ReactElement, useMemo, FC } from 'react';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { FullView, StyledView } from '/styled/common';
import { ProgramModel } from '/models/Program';
import { Formik } from 'formik';
import { QuestionModel } from '/models/Question';
import { FieldByType, FieldTypes } from '/helpers/fields';
import { Field } from '/components/Forms/FormField';
import { SectionHeader } from '/components/SectionHeader';
import { Button } from '/components/Button';
import * as Yup from 'yup';
import { theme } from '/styled/theme';

type ProgramAddDetailsScreenParams = {
  ProgramAddDetailsScreen: {
    program: ProgramModel
  }
}

type ProgramAddDetailsScreenRouteProps = RouteProp<ProgramAddDetailsScreenParams, 'ProgramAddDetailsScreen'>

type ProgramAddDetailsScreenProps = {
  navigation: NavigationProp<any>;
  route: ProgramAddDetailsScreenRouteProps
}


function makeStringCamelCase(string: string): string {
  return string.toLocaleLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, (word: string, index: number) => (index === 0 ? word.toLowerCase() : word.toUpperCase())).replace(/\s+/g, '');
}

const FormFields = (
  { program }:
  { program: ProgramModel},
): ReactElement[] => program.questions.map((questionList) => {
  const fields = questionList.list.map((question) => {
    const fieldInput: FC<any> = FieldByType[question.type];
    const isMultiline = question.type === FieldTypes.MULTILINE;
    return (
      <StyledView marginTop={10}>
        <Field
          key={question.id}
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
      <SectionHeader marginTop={20} h3>{questionList.title}</SectionHeader>
      {fields}
    </React.Fragment>
  );
});


function getFormInitialValues(program: ProgramModel): { [key: string]: any } {
  const questions = program.questions;

  const initialValues = questions
    .reduce<{[key: string]: any; }>((acc, cur) => {
      cur.list.forEach((question: QuestionModel) => {
        const initialValue = question.type === 'text' || question.type === 'multiline-text' ? '' : null;
        const propName = makeStringCamelCase(question.label);
        acc[propName] = initialValue;
      });
      return acc;
    }, {});
  return initialValues;
}

function getFormSchema(program: ProgramModel): Yup.ObjectSchema {
  const questions = program.questions;
  const objectShapeSchema = questions
    .reduce<{[key: string]: any; }>((acc, cur) => {
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
          acc[propName] = isDateType
            ? yupDateSchema
            : yupStringSchema;
        }
      });
      return acc;
    }, {});

  const schema = Yup.object().shape(objectShapeSchema);
  return schema;
}

export const ProgramAddDetailsScreen = ({
  route, ...props
}: ProgramAddDetailsScreenProps): ReactElement => {
  const { program } = route.params;
  const initialValues = useMemo(() => getFormInitialValues(program), [program]);
  const formValidationSchema = useMemo(() => getFormSchema(program), [program]);
  return (
    <FullView>
      <Formik
        validationSchema={formValidationSchema}
        initialValues={initialValues}
        onSubmit={(values): void => console.log(values)}
      >
        {({ handleSubmit }): ReactElement => (
          <FullView
            paddingLeft={20}
            paddingRight={20}
          >
            {FormFields({ program })}
            <Button
              marginTop={10}
              backgroundColor={theme.colors.PRIMARY_MAIN}
              buttonText="Submit"
              onPress={handleSubmit}
            />
          </FullView>
        )}
      </Formik>
    </FullView>
  );
};
