import React, { ReactElement } from 'react';
import { StyledText, StyledView } from '/styled/common';
import { IPatient, ISurveyScreenComponent, SurveyScreenConfig } from '~/types';
import { Field } from '../FormField';
import { FieldTypes } from '~/ui/helpers/fields';
import { FieldByType } from '~/ui/helpers/fieldComponents';
import { useBackendEffect } from '~/ui/hooks';
import { PatientDataDisplayField } from '../../PatientDataDisplayField/PatientDataDisplayField';

interface SurveyQuestionProps {
  component: ISurveyScreenComponent;
  setPosition: (pos: string) => void;
  patient: IPatient;
  // Dropdown components will overlap if there are 2 in a row if a z-index is not explicitly set
  zIndex: number;
  setDisableSubmit: (disabled?: boolean) => void;
}

function getField(
  type: string,
  { writeToPatient: { fieldType = '' } = {} }: SurveyScreenConfig = {},
): Element {
  let field = FieldByType[type];

  // see getComponentForQuestionType in web/app/utils/survey.jsx for source of the following logic
  if (type === FieldTypes.PATIENT_DATA) {
    if (fieldType) {
      // PatientData specifically can overwrite field type if we are writing back to patient record
      field = FieldByType[fieldType];
    } else {
      field = PatientDataDisplayField;
    }
  }
  if (field || field === null) return field;
  return (): Element => <StyledText>{`No field type ${type}`}</StyledText>;
}

const useGetConfig = component => {
  const configObject = component.getConfigObject();
  const [survey] = useBackendEffect(({ models }) => {
    const { source } = configObject;
    if (source !== 'ProgramRegistryClinicalStatus') {
      return null;
    }
    return models.Survey.findOne({
      where: {
        id: component.surveyId,
      },
      relations: ['program', 'program.registry'],
    });
  });
  if (configObject.source === 'ProgramRegistryClinicalStatus' && survey) {
    configObject.where = { programRegistryId: survey.program.registry.id };
  }

  return configObject;
};

export const SurveyQuestion = ({
  component,
  patient,
  setPosition,
  zIndex,
  setDisableSubmit,
}: SurveyQuestionProps): ReactElement => {
  const config = useGetConfig(component);
  const { dataElement } = component;
  const fieldInput: any = getField(dataElement.type, config);

  if (!fieldInput) return null;
  const isMultiline = dataElement.type === FieldTypes.MULTILINE;

  return (
    <StyledView
      marginTop={12}
      zIndex={zIndex}
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
        setDisableSubmit={setDisableSubmit}
      />
    </StyledView>
  );
};
