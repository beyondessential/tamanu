import React, { useState } from 'react';
import * as yup from 'yup';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
import PropTypes from 'prop-types';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useAuth } from '../../contexts/Auth';
import { foreignKey } from '../../utils/validation';

import { FormStep, MultiStepForm } from '../MultiStepForm';
import { LabRequestFormScreen1 } from './LabRequestFormScreen1';
import { LabRequestFormScreen2, screen2ValidationSchema } from './LabRequestFormScreen2';
import { LabRequestFormScreen3 } from './LabRequestFormScreen3';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { LowerCase } from '../../components';

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
  const { currentUser } = useAuth();
  const [initialSamples, setInitialSamples] = useState([]);

  // For fields please see LabRequestFormScreen1.js
  const screen1ValidationSchema = yup.object().shape({
    requestedById: foreignKey(
      <TranslatedText
        stringId="lab.requestedBy.validation"
        fallback="Requesting :clinicianText is required"
        replacements={{
          clinicianText: (
            <LowerCase>
              <TranslatedText
                stringId="general.localisedField.clinician.label.short"
                fallback="Clinician"
              />
            </LowerCase>
          ),
        }}
      />,
    ),
    requestedDate: yup
      .date()
      .required(
        <TranslatedText
          stringId="lab.requestedDate.validation"
          fallback="Request date is required"
        />,
      ),
    requestFormType: yup
      .string()
      .oneOf(Object.values(LAB_REQUEST_FORM_TYPES))
      .required(
        <TranslatedText
          stringId="lab.requestFormType.validation"
          fallback="Request type must be selected"
        />,
      ),
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
