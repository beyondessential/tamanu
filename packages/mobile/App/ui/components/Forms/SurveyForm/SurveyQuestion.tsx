import React, { ReactElement, FC } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { DataElementType, ISurveyScreenComponent } from '~/types';
import { Field } from '../FormField';
import { FieldTypes } from '~/ui/helpers/fields';
import { FieldByType } from '~/ui/helpers/fieldComponents';
import { Suggester } from '~/ui/helpers/suggester';
import { Routes } from '~/ui/helpers/routes';
import { useBackend } from '~/ui/hooks';
import { SurveyLink } from './SurveyLink';
import { SurveyResult } from './SurveyResult';
import { SurveyAnswerField } from './SurveyAnswerField';

interface SurveyQuestionProps {
  component: ISurveyScreenComponent;
  patient: any;
}

// Semicolon separated list because options will have commas in the text
function scsvToOptions(csv: string): { label: string, value: string}[] {
  return csv.split(';').map(value => {
    const trimmed = value.trim();
    return { label: trimmed, value: trimmed };
  });
}

/**
 * 
 * @param {Object} models Contains backend models.
 * @param {string} source Target model name.
 * @param {string} options Semicolon separated values, or JSON string to parse params for find(). (e.g. '{"where": {"type": "icd10"}}')
 */
function createSuggester(models, source, options) {
  return new Suggester(
    models[source],
    JSON.parse(options),
  );
}

function getField(type: string, component: ISurveyScreenComponent, models, patient): Element {
  const field = FieldByType[type];
  const { dataElement, source, options } = component;

  switch (type) {
    case DataElementType.Autocomplete:
      return (
        <Field
          component={field}
          placeholder={dataElement.defaultText}
          suggester={source && createSuggester(models, source, options)}
          options={!source && scsvToOptions(options)}
          modalRoute={Routes.Autocomplete.Modal}
          name={dataElement.id}
          label={dataElement.defaultText}
        />
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
