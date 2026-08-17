import React, { useState } from 'react';
import * as yup from 'yup';
import PropTypes from 'prop-types';
import { useDateTime } from '@tamanu/ui-components';
import { SETTING_KEYS } from '@tamanu/constants';

import { useAuth } from '../../contexts/Auth';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { FormStep, MultiStepForm } from '../MultiStepForm';
import { LabRequestFormScreen1 } from './LabRequestFormScreen1';
import { LabRequestFormScreen3 } from './LabRequestFormScreen3';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useSettings } from '../../contexts/Settings';
import { SAMPLE_DETAILS_FIELD_PREFIX } from '../../views/labRequest/SampleDetailsField';

const hasSelection = values =>
  Boolean((values.labTestTypeIds?.length ?? 0) + (values.panelIds?.length ?? 0));

export const LabRequestMultiStepForm = ({
  isSubmitting,
  practitionerSuggester,
  departmentSuggester,
  specimenTypeSuggester,
  labSampleSiteSuggester,
  encounter,
  onCancel,
  onSubmit,
  editedObject,
}) => {
  const { getCurrentDateTime } = useDateTime();
  const { getSetting } = useSettings();
  const mandateSpecimenType = getSetting(SETTING_KEYS.FEATURE_MANDATE_SPECIMEN_TYPE);
  const mandatePriority = getSetting('features.labRequest.priorityMandatory');

  const { currentUser } = useAuth();
  const [initialSamples, setInitialSamples] = useState([]);

  // The test/panel selection is required via the disabled Next button rather than a validation
  // message, so it isn't part of the schema. See LabRequestFormScreen1.js for the fields.
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
            />
          ),
        }}
      />,
    ),
    requestedDate: yup
      .date()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.requestDate.label" fallback="Request date" />,
      ),
    labTestPriorityId: (mandatePriority ? foreignKey() : optionalForeignKey()).translatedLabel(
      <TranslatedText stringId="lab.priority.label" fallback="Priority" />,
    ),
    notes: yup.string(),
  });

  const screen3ValidationSchema = yup.object().shape(
    initialSamples.reduce((acc, sample) => {
      acc[`${SAMPLE_DETAILS_FIELD_PREFIX}specimenType-${sample.panelId || sample.categoryId}`] =
        mandateSpecimenType
          ? yup.string().when(`sampleDetails.${sample.panelId || sample.categoryId}.sampleTime`, {
              is: value => !!value,
              then: yup
                .string()
                .required()
                .translatedLabel(
                  <TranslatedText stringId="lab.specimenType.label" fallback="Specimen type" />,
                ),
              otherwise: yup.string(),
            })
          : yup.string();

      return acc;
    }, {}),
  );

  return (
    <MultiStepForm
      onCancel={onCancel}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      initialValues={{
        requestedById: currentUser.id,
        departmentId: encounter.departmentId,
        requestedDate: getCurrentDateTime(),
        labTestTypeIds: [],
        panelIds: [],
        notes: '',
        ...editedObject,
      }}
      data-testid="multistepform-udmr"
    >
      <FormStep
        validationSchema={screen1ValidationSchema}
        getConfirmDisabled={values => !hasSelection(values)}
        data-testid="formstep-9ltq"
      >
        <LabRequestFormScreen1
          practitionerSuggester={practitionerSuggester}
          departmentSuggester={departmentSuggester}
          isPriorityMandatory={mandatePriority}
          onSelectionChange={setInitialSamples}
          data-testid="labrequestformscreen1-cz7w"
        />
      </FormStep>
      <FormStep
        validationSchema={screen3ValidationSchema}
        submitButtonText={
          <TranslatedText stringId="general.action.finalise" fallback="Finalise" />
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
