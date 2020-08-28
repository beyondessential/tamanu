import React, { ReactElement, FC } from 'react';
import { StyledView } from '/styled/common';
import { ISurveyScreenComponent } from '~/types';
import { VerticalPosition } from '../../../interfaces/VerticalPosition';
import { Field } from '../FormField';
import { FieldTypes, FieldByType } from '/helpers/fields';

interface ProgramQuestion {
  component: ISurveyScreenComponent;
  scrollTo: (item: { x: number; y: number }) => void;
  verticalPositions: VerticalPosition;
}

export const ProgramQuestion = ({
  component,
  scrollTo,
  verticalPositions,
}: ProgramQuestion): ReactElement => {
  const { dataElement } = component;
  const fieldInput: FC<any> = FieldByType[dataElement.type];
  if (!fieldInput) return null;
  const isMultiline = dataElement.type === FieldTypes.MULTILINE;
  return (
    <StyledView marginTop={10}>
      <Field
        onFocus={(): void => scrollTo(verticalPositions[component.id])}
        component={fieldInput}
        name={dataElement.id}
        options={component.getOptions()}
        multiline={isMultiline}
      />
    </StyledView>
  );
};
