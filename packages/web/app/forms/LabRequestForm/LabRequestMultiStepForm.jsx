import React, { useState } from 'react';
import * as yup from 'yup';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
import PropTypes from 'prop-types';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { foreignKey } from '../../utils/validation';

import { FormStep, MultiStepForm } from '../MultiStepForm';
import { LabRequestFormScreen1 } from './LabRequestFormScreen1';
import { LabRequestFormScreen2 } from './LabRequestFormScreen2';
import { LabRequestFormScreen3 } from './LabRequestFormScreen3';
import { TranslatedText } from '../../components/Translation/TranslatedText';

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
  const { getTranslation } = useTranslation();
  const { currentUser } = useAuth();
  const [initialSamples, setInitialSamples] = useState([]);

  // For fields please see LabRequestFormScreen1.js
  const screen1ValidationSchema = yup.object().shape({
    // Yup todo: localised clinician based label
    requestedById: foreignKey().label('requestingClinician'),
    requestedDate: yup
      .date()
      .required()
      .label('requestDate'),
    requestFormType: yup
      .string()
      .oneOf(Object.values(LAB_REQUEST_FORM_TYPES))
      .required()
      .label('requestType'),
  });

  const screen2ValidationSchema = yup.object().shape({
    labTestTypeIds: yup
      .array()
      .nullable()
      .when('requestFormType', {
        is: val => val === LAB_REQUEST_FORM_TYPES.INDIVIDUAL,
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
        is: val => val === LAB_REQUEST_FORM_TYPES.PANEL,
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
  const combinedValidationSchema = screen1ValidationSchema.concat(screen2ValidationSchema);

  return (
    <MultiStepForm
      onCancel={onCancel}
      onChangeStep={onChangeStep}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      initialValues={{
        requestedById: currentUser.id,
        departmentId: encounter.departmentId,
        requestedDate: getCurrentDateTimeString(),
        labTestTypeIds: [],
        panelIds: [],
        notes: '',
        ...editedObject,
      }}
      validationSchema={combinedValidationSchema}
    >
      <FormStep validationSchema={screen1ValidationSchema}>
        <LabRequestFormScreen1
          practitionerSuggester={practitionerSuggester}
          departmentSuggester={departmentSuggester}
        />
      </FormStep>
      <FormStep validationSchema={screen2ValidationSchema}>
        <LabRequestFormScreen2
          onSelectionChange={samples => {
            setInitialSamples(samples);
          }}
        />
      </FormStep>
      <FormStep
        submitButtonText={<TranslatedText stringId="general.action.finalise" fallback="Finalise" />}
      >
        <LabRequestFormScreen3
          practitionerSuggester={practitionerSuggester}
          specimenTypeSuggester={specimenTypeSuggester}
          labSampleSiteSuggester={labSampleSiteSuggester}
          initialSamples={initialSamples}
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
