import React, { ReactElement } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { IPatient, ISurveyScreenComponent } from '~/types';
import { Field } from '../FormField';
import { FieldTypes } from '~/ui/helpers/fields';
import { FieldByType } from '~/ui/helpers/fieldComponents';

interface SurveyQuestionProps {
  component: ISurveyScreenComponent;
  setPosition: (pos: string) => void;
  patient: IPatient;
}

function getField(type: string, { writeToPatient: { fieldType = '' } = {} } = {}): Element {
  let field = FieldByType[type];

  if (type === FieldTypes.PATIENT_DATA && fieldType) {
    // PatientData specifically can overwrite field type if we are writing back to patient records
    field = FieldByType[fieldType];
  }
  if (field || field === null) return field;
  return (): Element => <StyledText>{`No field type ${type}`}</StyledText>;
}

export const SurveyQuestion = ({
  component,
  patient,
  setPosition,
}: SurveyQuestionProps): ReactElement => {
  const { dataElement } = component;
  const config = component && component.getConfigObject();
  const fieldInput: any = getField(dataElement.type, config);

  if (!fieldInput) return null;
  const isMultiline = dataElement.type === FieldTypes.MULTILINE;

  return (
    <StyledView
      marginTop={10}
      onLayout={({ nativeEvent }): void => {
        setPosition(nativeEvent.layout.y);
      }}
    >
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
