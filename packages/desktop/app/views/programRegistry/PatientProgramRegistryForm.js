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
import { useSelector } from 'react-redux';
import { Divider } from '@material-ui/core';

export const PatientProgramRegistryForm = ({ onCancel, onSubmit, editedObject }) => {
  const api = useApi();
  const { currentUser, facility } = useAuth();
  const patient = useSelector(state => state.patient);
  const [selectedProgramRegistryId, setSelectedProgramRegistryId] = useState();

  const { data: program } = useQuery(['programRegistry', selectedProgramRegistryId], () =>
    selectedProgramRegistryId ? api.get(`programRegistry/${selectedProgramRegistryId}`) : null,
  );
  const { data: conditions } = useQuery(
    ['programRegistryConditions', selectedProgramRegistryId],
    () =>
      selectedProgramRegistryId
        ? api
            .get(`programRegistry/${selectedProgramRegistryId}/conditions`)
            .then(response => response.data.map(x => ({ label: x.name, value: x.id })))
        : undefined,
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
      showInlineErrorsOnly
      onSubmit={data => {
        onSubmit({
          ...data,
          conditionIds: data.conditionIds ? JSON.parse(data.conditionIds) : [],
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
                  placeholder="Select"
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
                  placeholder="Select"
                  required
                  component={AutocompleteField}
                  suggester={registeredBySuggester}
                />
                <Field
                  name="registeringFacilityId"
                  label="Registering facility"
                  placeholder="Select"
                  required
                  component={AutocompleteField}
                  suggester={registeringFacilitySuggester}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <FieldWithTooltip
                  tooltipText="Select a program registry to set the status"
                  name="clinicalStatusId"
                  label="Status"
                  placeholder="Select"
                  component={AutocompleteField}
                  suggester={programRegistryStatusSuggester}
                  disabled={!program}
                />
                <FieldWithTooltip
                  tooltipText="Select a program registry to add conditions"
                  name="conditionIds"
                  label="Related conditions"
                  placeholder="Select"
                  component={MultiselectField}
                  options={conditions}
                  disabled={!conditions}
                />
              </FormGrid>
              <Divider
                style={{
                  gridColumn: '1 / -1',
                  marginTop: '10px',
                }}
              />
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
        registeringFacilityId: facility.id,
        clinicianId: currentUser.id,
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        programRegistryId: foreignKey('Program registry must be selected'),
        clinicalStatusId: optionalForeignKey().nullable(),
        date: yup.date(),
        clinicianId: foreignKey('Registered by must be selected'),
        registeringFacilityId: foreignKey('Registering facility must be selected'),
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
