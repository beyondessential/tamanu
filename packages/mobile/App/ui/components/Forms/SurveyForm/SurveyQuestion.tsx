import React, { ReactElement, FC } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { ISurveyScreenComponent } from '~/types';
import { VerticalPosition } from '~/ui/interfaces/VerticalPosition';
import { Field } from '../FormField';
import { FieldTypes } from '~/ui/helpers/fields';
import { FieldByType } from '~/ui/helpers/fieldComponents';

interface SurveyQuestionProps {
  component: ISurveyScreenComponent;
}

function getField(type: string): FC<any> {
  const field = FieldByType[type];
  if(field || field === null) return field;

  return () => <StyledText>{`No field type ${type}`}</StyledText>;
}

export const SurveyQuestion = ({
  component,
}: SurveyQuestionProps): ReactElement => {
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
