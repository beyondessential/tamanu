import React, { useMemo } from 'react';
import styled from 'styled-components';
import { CHARTING_DATA_ELEMENT_IDS, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { getReferenceDataOptionStringId } from '@tamanu/shared/utils/translation';
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
import { TranslatedReferenceData, TranslatedText } from '../Translation';
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
    <Box data-testid="box-m234">
      <Typography
        style={{ fontSize: '14px', color: Colors.darkestText, fontWeight: 500 }}
        data-testid="typography-7mxf"
      >
        {text}
        {required && (
          <OuterLabelRequired data-testid="outerlabelrequired-uroc">*</OuterLabelRequired>
        )}
      </Typography>
      <Typography
        style={{ fontSize: '14px', color: Colors.darkText }}
        data-testid="typography-kjjb"
      >
        {component.detail}
      </Typography>
      <Typography
        style={{ fontSize: '14px', color: Colors.darkestText, fontStyle: 'italic', marginTop: 8 }}
        data-testid="typography-x1r4"
      >
        <TranslatedText
          stringId="program.modal.surveyResponse.geolocateNotSupported"
          fallback="The Geolocate question type is not supported by Tamanu Desktop. Please complete the form on Tamanu Mobile if required."
          data-testid="translatedtext-rwls"
        />
      </Typography>
    </Box>
  );
};

const getCustomComponentForQuestion = (component, required, FieldComponent) => {
  const text = component.text || component.dataElement.defaultText;

  if (component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.RESULT) {
    return <Text data-testid="text-lag8">{`${text} ${component.detail}`}</Text>;
  }

  if (component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.GEOLOCATE) {
    return (
      <GeolocateQuestion
        text={text}
        component={component}
        required={required}
        data-testid="geolocatequestion-lmkf"
      />
    );
  }

  if (component.dataElement.id === CHARTING_DATA_ELEMENT_IDS.dateRecorded
    || component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PHOTO) {
    return <FullWidthCol data-testid="fullwidthcol-6f9p">{FieldComponent}</FullWidthCol>;
  }

  return null;
};

export const SurveyQuestion = ({ component, patient, inputRef, disabled, encounterType }) => {
  const { encounter } = useEncounter();
  const { getTranslation } = useTranslation();

  const {
    id: componentId,
    detail: componentDetail,
    config: componentConfig,
    options: componentOptions,
    text: componentText,
    dataElement,
    validationCriteria,
  } = component;
  const { defaultText, type, defaultOptions, id } = dataElement;

  const text = componentText ? (
    <TranslatedReferenceData
      category="surveyScreenComponent.text"
      value={componentId}
      fallback={componentText}
    />
  ) : (
    <TranslatedReferenceData category="programDataElement" value={id} fallback={defaultText} />
  );
  const helperText = (
    <TranslatedReferenceData
      category="surveyScreenComponent.detail"
      value={componentId}
      fallback={componentDetail}
    />
  );
  const options = mapOptionsToValues(componentOptions || defaultOptions);
  const translatedOptions = useMemo(
    () =>
      options?.map(({ value }) => {
        const stringId = getReferenceDataOptionStringId(id, 'programDataElement', value);
        return {
          label: getTranslation(stringId, value),
          value,
        };
      }),
    [getTranslation, id, options],
  );

  const configObject = getConfigObject(id, componentConfig);
  const FieldComponent = getComponentForQuestionType(type, configObject);
  const validationCriteriaObject = getConfigObject(id, validationCriteria);
  const required = checkMandatory(validationCriteriaObject?.mandatory, {
    encounterType: encounterType || encounter?.encounterType,
  });
  const tooltip = getTooltip(type, configObject, getTranslation);

  if (!FieldComponent) {
    return <Text data-testid="text-k0tb">{text}</Text>;
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
      options={translatedOptions}
      config={configObject}
      helperText={helperText}
      required={required}
      disabled={disabled}
      data-testid={`wrapperfieldcomponent-${id}`}
    />
  );

  const customComponent = getCustomComponentForQuestion(component, required, fieldComponent);
  if (customComponent) {
    return customComponent;
  }

  return fieldComponent;
};
