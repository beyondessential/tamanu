import React, { ReactElement, FC } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { DataElementType, IPatient, ISurveyScreenComponent } from '~/types';
import { Field } from '../FormField';
import { FieldTypes } from '~/ui/helpers/fields';
import { FieldByType } from '~/ui/helpers/fieldComponents';
import { Suggester } from '~/ui/helpers/suggester';
import { Routes } from '~/ui/helpers/routes';
import { useBackend } from '~/ui/hooks';
import { SurveyLink } from './SurveyLink';
import { SurveyResult } from './SurveyResult';
import { SurveyAnswerField } from './SurveyAnswerField';
import { Dropdown } from '../../Dropdown';

interface SurveyQuestionProps {
  component: ISurveyScreenComponent;
  patient: any;
}

/**
 * 
 * @param {Object} models Contains backend models.
 * @param {string} source Target model name.
 */
function createSuggester(models, config) {
  return new Suggester(
    models[config.source],
    {},
  );
} 

function getField(type: string, component: ISurveyScreenComponent, models, patient: IPatient): Element {
  const field = FieldByType[type];
  const { dataElement } = component;

  switch (type) {
    case DataElementType.Autocomplete:
      return (
        <Field
          component={field}
          placeholder={dataElement.defaultText}
          suggester={createSuggester(models, component.getConfigObject())}
          modalRoute={Routes.Autocomplete.Modal}
          name={dataElement.id}
          label={dataElement.defaultText}
        />
        );
      case DataElementType.MultiSelect:
        return (
          <Dropdown isSingleSelect={false} />
        );
      case DataElementType.SurveyLink:
        return (
          <SurveyLink
            selectedPatient={patient}
            surveyId={source}
            questionId={dataElement.id}
          />
        );
      case DataElementType.SurveyResult:
        return (
          <SurveyResult
            selectedPatient={patient}
            surveyId={source}
            questionId={dataElement.id}
          />
        );
      case DataElementType.SurveyAnswer:
        return (
          <SurveyAnswerField
            questionId={dataElement.id}
            selectedPatient={patient}
            question={dataElement.defaultText}
            source={source}
          />
        );
    default:
      break;
  }
  
  if(field || field === null) return field;

  return () => <StyledText>{`No field type ${type}`}</StyledText>;
}

export const SurveyQuestion = ({
  component,
  patient,
}: SurveyQuestionProps): ReactElement => {
  const { dataElement } = component;
  const { models } = useBackend();
  const fieldInput: any = getField(dataElement.type, component, models, patient);
  if(!fieldInput) return null;
  const isMultiline = dataElement.type === FieldTypes.MULTILINE;

  return (
    <StyledView marginTop={10}>
      <Field
        component={fieldInput}
        name={dataElement.code}
        options={component.getOptions && component.getOptions()}
        multiline={isMultiline}
      />
    </StyledView>
  );
};
