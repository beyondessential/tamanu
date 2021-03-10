import React, { ReactElement } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { ISurveyScreenComponent } from '~/types';
import { Field } from '../FormField';
import { FieldTypes } from '~/ui/helpers/fields';
import { FieldByType } from '~/ui/helpers/fieldComponents';

interface SurveyQuestionProps {
  component: ISurveyScreenComponent;
  patient: any;
}

function getField(type: string, component: ISurveyScreenComponent): Element {
  const field = FieldByType[type];
  
  if(field || field === null) return field;
  return () => <StyledText>{`No field type ${type}`}</StyledText>;
}

export const SurveyQuestion = ({
  component,
  patient,
}: SurveyQuestionProps): ReactElement => {
  const { dataElement } = component;
  const fieldInput: any = getField(dataElement.type, component);
  if(!fieldInput) return null;
  const isMultiline = dataElement.type === FieldTypes.MULTILINE;
  const config = component.getConfigObject();

  return (
    <StyledView marginTop={10}>
      <Field
        component={fieldInput}
        name={dataElement.code}
        defaultText={dataElement.defaultText}
        options={component.getOptions && component.getOptions()}
        multiline={isMultiline}
        patient={patient}
        config={config}
      />
    </StyledView>
  );
};
