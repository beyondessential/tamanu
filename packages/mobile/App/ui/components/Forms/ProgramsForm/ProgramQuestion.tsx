import React, { ReactElement, FC } from 'react';
import { StyledView } from '/styled/common';
import { IQuestion } from '~/types';
import { VerticalPosition } from '../../../interfaces/VerticalPosition';
import { Field } from '../FormField';
import { FieldTypes, FieldByType } from '/helpers/fields';

interface ProgramQuestion {
  question: IQuestion;
  scrollTo: (item: { x: number; y: number }) => void;
  verticalPositions: VerticalPosition;
}

export const ProgramQuestion = ({
  question,
  scrollTo,
  verticalPositions,
}: ProgramQuestion): ReactElement => {
  const fieldInput: FC<any> = FieldByType[question.type];
  if (!fieldInput) return null;
  const isMultiline = question.type === FieldTypes.MULTILINE;
  return (
    <StyledView marginTop={10}>
      <Field
        onFocus={(): void => scrollTo(verticalPositions[question.id])}
        component={fieldInput}
        name={question.id}
        options={question.options}
        multiline={isMultiline}
      />
    </StyledView>
  );
};
