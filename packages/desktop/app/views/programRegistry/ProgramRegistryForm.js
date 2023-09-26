import React, { useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
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

export const ProgramRegistryForm = ({ onCancel, onSubmit, editedObject, patient }) => {
  const api = useApi();
  const { currentUser, facility } = useAuth();
  const [program, setProgram] = useState();
  const [conditions, setConditions] = useState([]);
  const programRegistrySuggester = useSuggester('programRegistries', {
    baseQueryParameters: { patientId: patient.id },
  });
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: program ? program.id : null },
  });
  const registeredBySuggester = useSuggester('practitioner');
  const registeringFacilitySuggester = useSuggester('facility');

  const onProgramSelect = async id => {
    try {
      const responses = await Promise.all([
        api.get(`programRegistry/${id}`),
        api.get(`programRegistry/${id}/conditions`),
      ]);

      const [programData, conditionsData] = responses;
      setProgram(programData);
      setConditions(conditionsData);
    } catch (error) {
      setProgram(undefined);
      setConditions(undefined);
    }
  };
  return (
    <Form
      onSubmit={data => {
        onSubmit({ ...data, patientId: patient.id });
      }}
      render={({ submitForm, values }) => {
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
                  onChange={target => {
                    onProgramSelect(target.target.value);
                  }}
                />

                <FieldWithTooltip
                  tooltipText="Select a program registry to set the status"
                  name="programRegistryClinicalStatusId"
                  label="Status"
                  component={AutocompleteField}
                  suggester={programRegistryStatusSuggester}
                  disabled={!program}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="date"
                  label="Date of registration"
                  saveDateAsString
                  required
                  component={DateField}
                />
                <Field
                  name="registeringClinicianId"
                  label="Registered by"
                  required
                  component={AutocompleteField}
                  suggester={registeredBySuggester}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="facilityId"
                  label="Registering facility"
                  component={AutocompleteField}
                  suggester={registeringFacilitySuggester}
                />
                <FieldWithTooltip
                  tooltipText="Select a program registry to add conditions"
                  name="conditions"
                  label="Conditions"
                  component={MultiselectField}
                  options={conditions}
                  disabled={!program}
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
        registeringClinicianId: currentUser.id,
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        programRegistryId: foreignKey('Program Registry must be selected'),
        programRegistryClinicalStatusId: optionalForeignKey(),
        date: yup.date(),
        facilityId: optionalForeignKey(),
        registeringClinicianId: foreignKey('Registered by must be selected'),
      })}
    />
  );
};

ProgramRegistryForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

ProgramRegistryForm.defaultProps = {
  editedObject: null,
};
