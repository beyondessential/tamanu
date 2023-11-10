import React, { useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useQuery } from '@tanstack/react-query';
import {
  Form,
  FieldWithTooltip,
  Field,
  DateField,
  AutocompleteField,
  MultiselectField,
} from '../../components/Field';
import { FormGrid } from '../../components/FormGrid';
import { ConfirmCancelRow } from '../../components/ButtonRow';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../../api/useApi';

export const PatientProgramRegistryForm = ({ onCancel, onSubmit, editedObject, patient }) => {
  const api = useApi();
  const { currentUser, facility } = useAuth();
  const [selectedProgramRegistryId, setSelectedProgramRegistryId] = useState();

  const { data: program } = useQuery(['programRegistry', selectedProgramRegistryId], () =>
    api.get(`programRegistry/${selectedProgramRegistryId}`),
  );
  const { data: conditions } = useQuery(
    ['programRegistryConditions', selectedProgramRegistryId],
    () => api.get(`programRegistry/${selectedProgramRegistryId}/conditions`),
  );
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
      onSubmit={data => {
        onSubmit({
          ...data,
          conditionIds: data.conditionIds ? data.conditionIds.split(',') : [],
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          patientId: patient.id,
        });
      }}
      render={({ submitForm, values, setValues }) => {
        const handleCancel = () => onCancel && onCancel();
        const getButtonText = isCompleted => {
          if (isCompleted) return 'Finalise';
          if (editedObject?.id) return 'Update';
          return 'Submit';
        };

        const isCompleted = !!values.completed;
        const buttonText = getButtonText(isCompleted);

        return (
          <div>
            <FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="programRegistryId"
                  label="Program registry"
                  required
                  component={AutocompleteField}
                  suggester={programRegistrySuggester}
                  onChange={event => {
                    if (selectedProgramRegistryId !== event.target.value) {
                      setValues({ ...values, clinicalStatusId: null, conditions: null });
                      setSelectedProgramRegistryId(event.target.value);
                    }
                  }}
                />

                <Field
                  name="date"
                  label="Date of registration"
                  saveDateAsString
                  required
                  component={DateField}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="clinicianId"
                  label="Registered by"
                  required
                  component={AutocompleteField}
                  suggester={registeredBySuggester}
                />
                <Field
                  name="facilityId"
                  label="Registering facility"
                  component={AutocompleteField}
                  suggester={registeringFacilitySuggester}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <FieldWithTooltip
                  tooltipText="Select a program registry to set the status"
                  name="clinicalStatusId"
                  label="Status"
                  component={AutocompleteField}
                  suggester={programRegistryStatusSuggester}
                  disabled={!program}
                />
                <FieldWithTooltip
                  tooltipText="Select a program registry to add conditions"
                  name="conditionIds"
                  label="Conditions"
                  component={MultiselectField}
                  options={conditions}
                  disabled={!conditions}
                />
              </FormGrid>

              <ConfirmCancelRow
                onCancel={handleCancel}
                onConfirm={submitForm}
                confirmText={buttonText}
              />
            </FormGrid>
          </div>
        );
      }}
      initialValues={{
        date: getCurrentDateTimeString(),
        facilityId: facility.id,
        clinicianId: currentUser.id,
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        programRegistryId: foreignKey('Program Registry must be selected'),
        clinicalStatusId: optionalForeignKey(),
        date: yup.date(),
        facilityId: optionalForeignKey(),
        clinicianId: foreignKey('Registered by must be selected'),
        conditions: yup.array().of(yup.string()),
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
