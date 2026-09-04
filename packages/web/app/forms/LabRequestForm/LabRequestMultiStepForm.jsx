import React, { useCallback, useState } from 'react';
import * as yup from 'yup';
import PropTypes from 'prop-types';
import { useDateTime } from '@tamanu/ui-components';
import { SETTING_KEYS } from '@tamanu/constants';

import { useAuth } from '../../contexts/Auth';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { FormStep, MultiStepForm } from '../MultiStepForm';
import { LabRequestFormScreen1 } from './LabRequestFormScreen1';
import { LabRequestFormScreen2 } from './LabRequestFormScreen2';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useSettings } from '../../contexts/Settings';

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
  const [samples, setSamples] = useState([]);

  // Categories with no sample time are created as "sample not collected"; the sample-details table
  // keeps a row's other values while its time is blank/invalid, so drop those entries on submit.
  const handleSubmit = useCallback(
    (values, ...rest) => {
      const sampleDetails = Object.fromEntries(
        Object.entries(values.sampleDetails ?? {}).filter(([, details]) => details?.sampleTime),
      );
      return onSubmit({ ...values, sampleDetails }, ...rest);
    },
    [onSubmit],
  );

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

  // Specimen type is required per category once its sample time is entered (when the feature is on).
  // sampleDetails is a map keyed by categoryId; each entry holds that category's sample fields.
  const screen2ValidationSchema = yup.object().shape({
    sampleDetails: yup.object().shape(
      samples.reduce((acc, sample) => {
        acc[sample.categoryId] = yup.object().shape({
          specimenTypeId: mandateSpecimenType
            ? yup.string().when('sampleTime', {
                is: value => Boolean(value),
                then: yup
                  .string()
                  .required()
                  .translatedLabel(
                    <TranslatedText stringId="lab.specimenType.label" fallback="Specimen type" />,
                  ),
                otherwise: yup.string(),
              })
            : yup.string(),
        });

        return acc;
      }, {}),
    ),
  });

  return (
    <MultiStepForm
      onCancel={onCancel}
      onSubmit={handleSubmit}
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
          onSelectionChange={setSamples}
          data-testid="labrequestformscreen1-cz7w"
        />
      </FormStep>
      <FormStep
        validationSchema={screen2ValidationSchema}
        submitButtonText={
          <TranslatedText stringId="general.action.finalise" fallback="Finalise" />
        }
        data-testid="formstep-2u2d"
      >
        <LabRequestFormScreen2
          practitionerSuggester={practitionerSuggester}
          specimenTypeSuggester={specimenTypeSuggester}
          labSampleSiteSuggester={labSampleSiteSuggester}
          samples={samples}
          data-testid="labrequestformscreen2-jejy"
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
