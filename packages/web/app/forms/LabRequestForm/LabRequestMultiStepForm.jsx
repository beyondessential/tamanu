import React, { useState } from 'react';
import * as yup from 'yup';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { foreignKey } from '../../utils/validation';
import { useDateTimeFormat } from '@tamanu/ui-components';

import { FormStep, MultiStepForm } from '../MultiStepForm';
import { LabRequestFormScreen1 } from './LabRequestFormScreen1';
import { LabRequestFormScreen2 } from './LabRequestFormScreen2';
import { LabRequestFormScreen3 } from './LabRequestFormScreen3';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useSettings } from '../../contexts/Settings';
import { SETTING_KEYS } from '@tamanu/constants';
import { SAMPLE_DETAILS_FIELD_PREFIX } from '../../views/labRequest/SampleDetailsField';

export const LabRequestMultiStepForm = ({
  isSubmitting,
  practitionerSuggester,
  departmentSuggester,
  specimenTypeSuggester,
  labSampleSiteSuggester,
  encounter,
  onCancel,
  onChangeStep,
  onSubmit,
  editedObject,
}) => {
  const { getCountryCurrentDateTimeString } = useDateTimeFormat();
  const { getSetting } = useSettings();
  const mandateSpecimenType = getSetting(SETTING_KEYS.FEATURE_MANDATE_SPECIMEN_TYPE);

  const { getTranslation } = useTranslation();
  const { currentUser } = useAuth();
  const [initialSamples, setInitialSamples] = useState([]);

  // For fields please see LabRequestFormScreen1.js
  const screen1ValidationSchema = yup.object().shape({
    requestedById: foreignKey().translatedLabel(
      <TranslatedText
        stringId="lab.requestingClinician.label"
        fallback="Requesting :clinician"
        replacements={{
          clinician: (
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
              casing="lower"
              data-testid="translatedtext-d8im"
            />
          ),
        }}
        data-testid="translatedtext-fg6b"
      />,
    ),
    requestedDate: yup
      .date()
      .required()
      .translatedLabel(
        <TranslatedText
          stringId="general.requestDate.label"
          fallback="Request date"
          data-testid="translatedtext-63ek"
        />,
      ),
    requestFormType: yup
      .string()
      .oneOf(Object.values(LAB_REQUEST_FORM_TYPES))
      .required()
      .translatedLabel(
        <TranslatedText
          stringId="general.requestType.label"
          fallback="Request type"
          data-testid="translatedtext-xm3y"
        />,
      ),
  });

  const screen2ValidationSchema = yup.object().shape({
    labTestTypeIds: yup
      .array()
      .nullable()
      .when('requestFormType', {
        is: (val) => val === LAB_REQUEST_FORM_TYPES.INDIVIDUAL,
        then: yup
          .array()
          .of(yup.string())
          .min(
            1,
            getTranslation(
              'validation.rule.atLeast1TestType',
              'Please select at least one test type',
            ),
          ),
      }),
    panelIds: yup
      .array()
      .nullable()
      .when('requestFormType', {
        is: (val) => val === LAB_REQUEST_FORM_TYPES.PANEL,
        then: yup
          .array()
          .of(yup.string())
          .min(
            1,
            getTranslation('validation.rule.atLeast1Panel', 'Please select at least one panel'),
          ),
      }),
    notes: yup.string(),
  });

  const screen3ValidationSchema = yup.object().shape(
    initialSamples.reduce((acc, sample) => {
      acc[`${SAMPLE_DETAILS_FIELD_PREFIX}specimenType-${sample.panelId || sample.categoryId}`] =
        mandateSpecimenType
          ? yup.string().when(`sampleDetails.${sample.panelId || sample.categoryId}.sampleTime`, {
              is: (value) => !!value,
              then: yup
                .string()
                .required()
                .translatedLabel(
                  <TranslatedText
                    stringId="lab.specimenType.label"
                    fallback="Specimen type"
                    data-testid="translatedtext-sj2g"
                  />,
                ),
              otherwise: yup.string(),
            })
          : yup.string();

      return acc;
    }, {}),
  );

  const combinedValidationSchema = screen1ValidationSchema
    .concat(screen2ValidationSchema)
    .concat(screen3ValidationSchema);

  return (
    <MultiStepForm
      onCancel={onCancel}
      onChangeStep={onChangeStep}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      initialValues={{
        requestedById: currentUser.id,
        departmentId: encounter.departmentId,
        requestedDate: getCountryCurrentDateTimeString(),
        labTestTypeIds: [],
        panelIds: [],
        notes: '',
        ...editedObject,
      }}
      validationSchema={combinedValidationSchema}
      data-testid="multistepform-udmr"
    >
      <FormStep validationSchema={screen1ValidationSchema} data-testid="formstep-9ltq">
        <LabRequestFormScreen1
          practitionerSuggester={practitionerSuggester}
          departmentSuggester={departmentSuggester}
          data-testid="labrequestformscreen1-cz7w"
        />
      </FormStep>
      <FormStep validationSchema={screen2ValidationSchema} data-testid="formstep-04p2">
        <LabRequestFormScreen2
          onSelectionChange={(samples) => {
            setInitialSamples(samples);
          }}
          data-testid="labrequestformscreen2-1d6k"
        />
      </FormStep>
      <FormStep
        validationSchema={screen3ValidationSchema}
        submitButtonText={
          <TranslatedText
            stringId="general.action.finalise"
            fallback="Finalise"
            data-testid="translatedtext-2ap2"
          />
        }
        data-testid="formstep-2u2d"
      >
        <LabRequestFormScreen3
          practitionerSuggester={practitionerSuggester}
          specimenTypeSuggester={specimenTypeSuggester}
          labSampleSiteSuggester={labSampleSiteSuggester}
          initialSamples={initialSamples}
          data-testid="labrequestformscreen3-jejy"
        />
      </FormStep>
    </MultiStepForm>
  );
};

LabRequestMultiStepForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  practitionerSuggester: PropTypes.object.isRequired,
  encounter: PropTypes.object,
  editedObject: PropTypes.object,
  isSubmitting: PropTypes.bool,
};

LabRequestMultiStepForm.defaultProps = {
  encounter: {},
  editedObject: {},
  isSubmitting: false,
};
