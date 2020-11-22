import React, { ReactElement, FC } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { ISurveyScreenComponent } from '~/types';
import { VerticalPosition } from '../../../interfaces/VerticalPosition';
import { Field } from '../FormField';
import { FieldTypes, FieldByType } from '/helpers/fields';

interface ProgramQuestion {
  component: ISurveyScreenComponent;
}

function getField(type: string): FC<any> {
  const field = FieldByType[type];
  if(field || field === null) return field;

  return () => <StyledText>{`No field type ${type}`}</StyledText>;
}

export const ProgramQuestion = ({
  component,
}: ProgramQuestion): ReactElement => {
  const { dataElement } = component;
  const fieldInput: FC<any> = getField(dataElement.type);
  if(!fieldInput) return null;
  const isMultiline = dataElement.type === FieldTypes.MULTILINE;
  return (
    <StyledView marginTop={10}>
      <Field
        component={fieldInput}
        name={dataElement.code}
        options={component.getOptions()}
        multiline={isMultiline}
      />
    </StyledView>
  );
};
