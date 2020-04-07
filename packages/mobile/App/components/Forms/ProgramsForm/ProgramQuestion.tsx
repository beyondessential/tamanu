import React, { ReactElement, FC } from 'react';
import { StyledView } from '/styled/common';
import { QuestionModel } from '/models/Question';
import { VerticalPosition } from '/interfaces/VerticalPosition';
import { makeStringCamelCase } from '/root/App/navigation/screens/programs/tabs/ProgramAddDetailsScreen/helpers';
import { Field } from '../FormField';
import { FieldTypes, FieldByType } from '/helpers/fields';

interface ProgramQuestion {
  question: QuestionModel;
  scrollTo: (item: { x: number; y: number }) => void;
  verticalPositions: VerticalPosition;
}

export const ProgramQuestion = ({
  question,
  scrollTo,
  verticalPositions,
}: ProgramQuestion): ReactElement => {
  const fieldInput: FC<any> = FieldByType[question.type];
  const isMultiline = question.type === FieldTypes.MULTILINE;
  return (
    <StyledView marginTop={10}>
      <Field
        onFocus={(): void => scrollTo(verticalPositions[question.id])}
        component={fieldInput}
        name={makeStringCamelCase(question.label)}
        options={question.options}
        multiline={isMultiline}
        label={question.label}
      />
    </StyledView>
  );
};
