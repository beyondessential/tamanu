import React, { ReactElement, useMemo } from 'react';
import { StyledText, StyledView } from '/styled/common';
import { IPatient, ISurveyScreenComponent, SurveyScreenConfig } from '~/types';
import { Field } from '../FormField';
import { FieldTypes } from '~/ui/helpers/fields';
import { FieldByType } from '~/ui/helpers/fieldComponents';
import { useBackendEffect } from '~/ui/hooks';
import { PatientDataDisplayField } from '../../PatientDataDisplayField/PatientDataDisplayField';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { PATIENT_DATA_FIELD_LOCATIONS, SEX_VALUES } from '@tamanu/constants';
import { getReferenceDataOptionStringId } from '../../Translations/TranslatedReferenceData';
import { useSettings } from '~/ui/contexts/SettingsContext';

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

// Keep in sync with web/app/utils/survey.jsx
function mapOptionsToValues(optionsString: string) {
  if (!optionsString) return null;
  try {
    const options = JSON.parse(optionsString);
    if (typeof options === 'object') {
      // sometimes this is a map of value => value
      return Object.values(options).map(x => ({ label: x, value: x }));
    }
    if (!Array.isArray(options)) return null;
    return options.map(x => ({ label: x, value: x }));
  } catch (e) {
    return null;
  }
}

export const SurveyQuestion = ({
  component,
  patient,
  setPosition,
  zIndex,
  setDisableSubmit,
}: SurveyQuestionProps): ReactElement => {
  const { getSetting } = useSettings();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const config = useGetConfig(component);
  const { dataElement } = component;
  const fieldInput: any = getField(dataElement.type, config);

  const options = mapOptionsToValues(component.options || component.dataElement.defaultOptions);
  const translatedOptions = useMemo(() => {
    // if the question is a patient data question with a select field type,
    // we need to get the options from the patient data field locations, so the users don't need to translate the options twice
    // If the options aren't available, we'll use the options from the componentOptions
    if (dataElement.type === FieldTypes.PATIENT_DATA) {
      const config = component.getConfigObject();
      const { writeToPatient, column } = config;
      if (writeToPatient?.fieldType === FieldTypes.SELECT) {
        const [, , constantOptions] = PATIENT_DATA_FIELD_LOCATIONS[column] || [];
        if (constantOptions) {
          const result = Object.keys(constantOptions).map(value => ({
            label: getEnumTranslation(constantOptions, value),
            value,
          }));

          if (column === 'sex' && getSetting('features.hideOtherSex')) {
            return result.filter(option => option.value !== SEX_VALUES.OTHER);
          }

          return result;
        }
      }
    }
    return options?.map(({ value }) => {
      const stringId = getReferenceDataOptionStringId(dataElement.id, 'programDataElement', value);
      return {
        label: getTranslation(stringId, value),
        value,
      };
    });
  }, [getTranslation, dataElement.id, options, dataElement.type, getEnumTranslation, component.config]);

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
        options={translatedOptions || []}
        multiline={isMultiline}
        patient={patient}
        config={config}
        setDisableSubmit={setDisableSubmit}
      />
    </StyledView>
  );
};
