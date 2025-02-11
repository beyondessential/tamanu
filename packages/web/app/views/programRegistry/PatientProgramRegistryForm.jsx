import React, { useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { Divider } from '@material-ui/core';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { useSelector } from 'react-redux';
import {
  AutocompleteField,
  DateField,
  Field,
  FieldWithTooltip,
  Form,
} from '../../components/Field';
import { FormGrid } from '../../components/FormGrid';
import { ModalFormActionRow, TranslatedText } from '../../components';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { useSuggester } from '../../api';
import { useProgramRegistryQuery } from '../../api/queries';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { FORM_TYPES } from '../../constants';
import { RelatedConditionFields } from './RelatedConditionFields';

export const PatientProgramRegistryForm = ({ onCancel, onSubmit, editedObject }) => {
  const { getTranslation } = useTranslation();
  const { currentUser, facilityId } = useAuth();
  const patient = useSelector((state) => state.patient);
  const [selectedProgramRegistryId, setSelectedProgramRegistryId] = useState();

  const { data: program } = useProgramRegistryQuery(selectedProgramRegistryId);

  const programRegistrySuggester = useSuggester('programRegistry', {
    baseQueryParameters: { patientId: patient.id },
  });
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: program ? program.id : null },
  });
  const registeredBySuggester = useSuggester('practitioner');
  const registeringFacilitySuggester = useSuggester('facility');

  return (
    <Form
      showInlineErrorsOnly
      onSubmit={async (data) => {
        return onSubmit({
          ...data,
          conditions: data.conditions ? data.conditions : [],
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          patientId: patient.id,
        });
      }}
      render={({ submitForm, values, setValues }) => {
        const handleCancel = () => onCancel && onCancel();
        const getButtonText = (isCompleted) => {
          if (isCompleted) return 'Finalise';
          if (editedObject?.id) return 'Update';
          return 'Confirm';
        };

        const isCompleted = !!values.completed;
        const buttonText = getButtonText(isCompleted);

        return (
          <>
            <FormGrid style={{ paddingBottom: 30 }}>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="programRegistryId"
                  label={
                    <TranslatedText
                      stringId="patientProgramRegistry.programRegistry.label"
                      fallback="Program registry"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  required
                  component={AutocompleteField}
                  suggester={programRegistrySuggester}
                  onChange={(event) => {
                    if (selectedProgramRegistryId !== event.target.value) {
                      setValues({ ...values, clinicalStatusId: null, conditions: null });
                      setSelectedProgramRegistryId(event.target.value);
                    }
                  }}
                />
                <Field
                  name="date"
                  label={
                    <TranslatedText
                      stringId="patientProgramRegistry.date.label"
                      fallback="Date of registration"
                    />
                  }
                  saveDateAsString
                  required
                  component={DateField}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="clinicianId"
                  label={
                    <TranslatedText
                      stringId="patientProgramRegistry.registeredBy.label"
                      fallback="Registered by"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  required
                  component={AutocompleteField}
                  suggester={registeredBySuggester}
                />
                <Field
                  name="registeringFacilityId"
                  label={
                    <TranslatedText
                      stringId="patientProgramRegistry.registeringFacility.label"
                      fallback="Registering facility"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  required
                  component={AutocompleteField}
                  suggester={registeringFacilitySuggester}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <FieldWithTooltip
                  disabledTooltipText="Select a program registry to set the status"
                  name="clinicalStatusId"
                  label={<TranslatedText stringId="general.status.label" fallback="Status" />}
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  component={AutocompleteField}
                  suggester={programRegistryStatusSuggester}
                  disabled={!program}
                />
              </FormGrid>
              <Divider
                style={{
                  gridColumn: '1 / -1',
                }}
              />
              <RelatedConditionFields
                programRegistryId={selectedProgramRegistryId}
                formValues={values}
              />
            </FormGrid>
            <ModalFormActionRow
              confirmText={buttonText}
              onConfirm={submitForm}
              onCancel={handleCancel}
            />
          </>
        );
      }}
      initialValues={{
        date: getCurrentDateTimeString(),
        registeringFacilityId: facilityId,
        clinicianId: currentUser.id,
        ...editedObject,
      }}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        programRegistryId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="patientProgramRegistry.programRegistry.label"
            fallback="Program registry"
          />,
        ),
        clinicalStatusId: optionalForeignKey().nullable(),
        date: yup.date(),
        clinicianId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="patientProgramRegistry.registeredBy.label"
            fallback="Registered by"
          />,
        ),
        registeringFacilityId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="patientProgramRegistry.registeringFacility.label"
            fallback="Registering facility"
          />,
        ),
      })}
    />
  );
};

PatientProgramRegistryForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

PatientProgramRegistryForm.defaultProps = {
  editedObject: null,
};
