import React from 'react';
import styled from 'styled-components';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import {
  checkMandatory,
  getComponentForQuestionType,
  getConfigObject,
  mapOptionsToValues,
} from '../../utils';
import { Field } from '../Field';
import { useEncounter } from '../../contexts/Encounter';
import { Box, Typography } from '@material-ui/core';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';

const Text = styled.div`
  margin-bottom: 10px;
`;

export const SurveyQuestion = ({ component, patient, inputRef, disabled, encounterType }) => {
  const {
    dataElement,
    detail,
    config: componentConfig,
    options: componentOptions,
    text: componentText,
    validationCriteria,
  } = component;
  const { encounter } = useEncounter();
  const { defaultText, type, defaultOptions, id } = dataElement;
  const configObject = getConfigObject(id, componentConfig);
  const text = componentText || defaultText;
  const options = mapOptionsToValues(componentOptions || defaultOptions);
  const FieldComponent = getComponentForQuestionType(type, configObject);

  const validationCriteriaObject = getConfigObject(id, validationCriteria);
  const required = checkMandatory(validationCriteriaObject?.mandatory, {
    encounterType: encounterType || encounter?.encounterType,
  });

  if (component.dataElement.type === 'Result') return <Text>{`${text} ${component.detail}`}</Text>;
  if (component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.GEOLOCATE) {
    return (
      <Box>
        <Typography style={{ fontSize: '14px', color: Colors.darkestText, fontWeight: 500 }}>
          {text}
        </Typography>
        <Typography style={{ fontSize: '14px', color: Colors.darkText }}>
          {component.detail}
        </Typography>
        <Typography
          style={{ fontSize: '14px', color: Colors.darkestText, fontStyle: 'italic', marginTop: 8 }}
        >
          <TranslatedText
            stringId="program.modal.surveyResponse.geolocateNotSupported"
            fallback="The Geolocate question type is not supported by Tamanu Desktop. Please complete the form on Tamanu Mobile if required."
          />
        </Typography>
      </Box>
    );
  }
  if (!FieldComponent) return <Text>{text}</Text>;

  return (
    <Field
      inputRef={inputRef}
      label={text}
      component={FieldComponent}
      patient={patient}
      name={id}
      options={options}
      config={configObject}
      helperText={detail}
      required={required}
      disabled={disabled}
    />
  );
};
