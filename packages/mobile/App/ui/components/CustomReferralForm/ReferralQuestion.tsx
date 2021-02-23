import React, { useEffect, useState, useCallback, FC } from 'react';

import { FullView, StyledScrollView, StyledView } from '/styled/common';
import { Text } from 'react-native-paper';
import { Field } from '../Forms/FormField';
import { FieldByType } from '~/ui/helpers/fieldComponents';
import { FieldTypes } from '~/ui/helpers/fields';
import { Title } from 'react-native-paper';
import { SurveyAnswerField } from './SurveyAnswerField';
import { useBackend } from '~/ui/hooks';
import { Suggester } from '~/ui/helpers/suggester';
import { Routes } from '~/ui/helpers/routes';
import { SurveyLink } from './SurveyLink';
import { SurveyResult } from './SurveyResult';


function getField(type: string): FC<any> {
  const field = FieldByType[type];
  if(field || field === null) return field;

  return () => <Text>{`No field type ${type}`}</Text>;
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

export const ReferralQuestion = ({ data, patientData, navigation }) => {
  const { models } = useBackend();
  const { question, field, options, type, source, id } = data;
  const fieldInput: React.FC<any> = getField(field);
  if(!fieldInput) return null;
  const isMultiline = field === FieldTypes.MULTILINE;

  switch (type) {
    case 'input':
      if (field === FieldTypes.AUTOCOMPLETE) {
        return (
          <Field
            component={fieldInput}
            placeholder={question}
            navigation={navigation}
            suggester={source && createSuggester(models, source, options)}
            options={!source && scsvToOptions(options)}
            modalRoute={Routes.Autocomplete.Modal}
            name={id}
            label={question}
          />
        )
      }
      return (
        <Field
          component={fieldInput}
          name={id}
          label={question}
          options={options && scsvToOptions(options)}
          multiline={isMultiline}
        />
      );
    case 'survey':
      if (field === 'SurveyLink') {
        return (
          <SurveyLink
            selectedPatient={patientData}
            surveyId={source}
            questionId={id}
          />
        );
      }
      if (field === 'SurveyResult') {
        return (
          <SurveyResult
            selectedPatient={patientData}
            surveyId={source}
            questionId={id}
          />
        );
      }
      return (
        <SurveyAnswerField
          data={data}
        />
      );
    default:
      return <Text>{`Could not create question of type: ${type}`}</Text>
  }
}