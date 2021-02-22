import React, { useEffect, useState, useCallback, FC } from 'react';

import { FullView, StyledScrollView, StyledView } from '/styled/common';
import { Text } from 'react-native-paper';
import { Field } from '../Forms/FormField';
import { FieldByType } from '~/ui/helpers/fieldComponents';
import { FieldTypes } from '~/ui/helpers/fields';
import { Title } from 'react-native-paper';
import { SurveyAnswerField } from './SurveyAnswerField';


function getField(type: string): FC<any> {
  const field = FieldByType[type];
  if(field || field === null) return field;

  return () => <Text>{`No field type ${type}`}</Text>;
}

// Semi colon separated list because options will have commas in the text
function scsvToOptions(csv: string): { label: string, value: string}[] {
  return csv.split(';').map(value => {
    const trimmed = value.trim();
    return { label: trimmed, value: trimmed };
  });
}

export const ReferralQuestion = ({ data, patientData }) => {
  const {question, field, options, type, source, id} = data;
  const fieldInput: React.FC<any> = getField(field);
  if(!fieldInput) return null;
  const isMultiline = field === FieldTypes.MULTILINE;

  switch (type) {
    case 'input':
      return (
        <StyledView marginTop={10}>
          <Field
            component={fieldInput}
            name={id}
            label={question}
            options={options && scsvToOptions(options)}
            multiline={isMultiline}
          />
        </StyledView>
      );
    case 'survey':
      return (
        <StyledView marginTop={10}>
          <SurveyAnswerField
            data={data}
          />
        </StyledView>
      );
    case 'patient':
      return (
        <StyledView marginTop={10}>
          <Field
            component={fieldInput}
            name={id}
            label={question}
            value={patientData[source] || ''}
            disabled
          />
        </StyledView>
      );
    default:
      <Text>{`Could not create question of type: ${type}`}</Text>
      break;
  }
}