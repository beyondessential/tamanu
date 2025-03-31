import React from 'react';
import styled from 'styled-components';
import { CHARTING_DATA_ELEMENT_IDS, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import {
  checkMandatory,
  getComponentForQuestionType,
  getConfigObject,
  getTooltip,
  mapOptionsToValues,
} from '../../utils';
import { Field, FieldWithTooltip } from '../Field';
import { useEncounter } from '../../contexts/Encounter';
import { Box, Typography } from '@material-ui/core';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation';
import { useTranslation } from '../../contexts/Translation';

const Text = styled.div`
  margin-bottom: 10px;
`;

export const FullWidthCol = styled.div`
  grid-column: 1/-1;
`;

const OuterLabelRequired = styled.span`
  color: ${Colors.alert};
  padding-left: 3px;
`;

const GeolocateQuestion = ({ text, component, required }) => {
  return (
    <Box>
      <Typography style={{ fontSize: '14px', color: Colors.darkestText, fontWeight: 500 }}>
        {text}
        {required && <OuterLabelRequired>*</OuterLabelRequired>}
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
          data-test-id='translatedtext-iuam' />
      </Typography>
    </Box>
  );
};

const getCustomComponentForQuestion = (component, required, FieldComponent) => {
  const text = component.text || component.dataElement.defaultText;

  if (component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.RESULT) {
    return <Text>{`${text} ${component.detail}`}</Text>;
  }

  if (component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.GEOLOCATE) {
    return <GeolocateQuestion text={text} component={component} required={required} />;
  }

  if (component.dataElement.id === CHARTING_DATA_ELEMENT_IDS.dateRecorded) {
    return <FullWidthCol>{FieldComponent}</FullWidthCol>;
  }

  return null;
};

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
  const { getTranslation } = useTranslation();
  const { defaultText, type, defaultOptions, id } = dataElement;
  const configObject = getConfigObject(id, componentConfig);
  const text = componentText || defaultText;
  const options = mapOptionsToValues(componentOptions || defaultOptions);
  const FieldComponent = getComponentForQuestionType(type, configObject);

  const validationCriteriaObject = getConfigObject(id, validationCriteria);
  const required = checkMandatory(validationCriteriaObject?.mandatory, {
    encounterType: encounterType || encounter?.encounterType,
  });
  const tooltip = getTooltip(type, configObject, getTranslation);

  if (!FieldComponent) {
    return <Text>{text}</Text>;
  }

  const WrapperFieldComponent = tooltip ? FieldWithTooltip : Field;
  const fieldComponent = (
    <WrapperFieldComponent
      tooltipText={tooltip}
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

  const customComponent = getCustomComponentForQuestion(component, required, fieldComponent);
  if (customComponent) {
    return customComponent;
  }

  return fieldComponent;
};
