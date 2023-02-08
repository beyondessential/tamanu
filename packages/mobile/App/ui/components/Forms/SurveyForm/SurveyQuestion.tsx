import React, { ReactElement, RefObject, useEffect, useState } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { FormikErrors } from 'formik';
import { ScrollView } from 'react-native';
import { GenericFormValues, IPatient, ISurveyScreenComponent } from '~/types';
import { Field } from '../FormField';
import { FieldTypes } from '~/ui/helpers/fields';
import { FieldByType } from '~/ui/helpers/fieldComponents';

interface SurveyQuestionProps {
  component: ISurveyScreenComponent;
  errors: FormikErrors<GenericFormValues>;
  scrollViewRef: RefObject<ScrollView>;
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
  errors,
  scrollViewRef,
}: SurveyQuestionProps): ReactElement => {
  const [position, setPosition] = useState(null);
  const { dataElement } = component;
  const config = component && component.getConfigObject();
  const fieldInput: any = getField(dataElement.type, config);

  useEffect(() => {
    if (Object.keys(errors).length === 0) {
      return;
    }
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey === component.dataElement.code && scrollViewRef.current !== null) {
      // Allow a bit of space at the top of the form field for the form label text
      const positionOffset = 25;
      scrollViewRef.current?.scrollTo({ x: 0, y: position - positionOffset, animated: true });
    }
  }, [component.id, errors, scrollViewRef, position]);

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
