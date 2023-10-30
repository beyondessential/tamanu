import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import {
  Form,
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
import { Modal } from '../../components/Modal';
import { useApi } from '../../api/useApi';
import { useQuery } from '@tanstack/react-query';

export const ActivatePatientProgramRegistry = React.memo(
  ({ onCancel, onSubmit, patientProgramRegistration, open }) => {
    const api = useApi();
    const { currentUser, facility } = useAuth();
    const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
      baseQueryParameters: { programRegistryId: patientProgramRegistration.programRegistryId },
    });
    const registeredBySuggester = useSuggester('practitioner');
    const { data: conditions } = useQuery(
      ['programRegistryConditions', patientProgramRegistration.id],
      () => api.get(`programRegistry/${patientProgramRegistration.id}/conditions`),
    );
    const registeringFacilitySuggester = useSuggester('facility');

    return (
      <Modal
        title={`Activate ${patientProgramRegistration.programRegistry.name} program registry`}
        open={open}
        onClose={onCancel}
      >
        <Form
          onSubmit={data => {
            onSubmit({
              ...data,
              patientId: patientProgramRegistration.patientId,
              programRegistryId: patientProgramRegistration.id,
              conditions: data.conditions ? data.conditions.split(',') : [],
            });
          }}
          render={({ submitForm }) => {
            const handleCancel = () => onCancel && onCancel();
            return (
              <div>
                <FormGrid>
                  <FormGrid style={{ gridColumn: 'span 2' }}>
                    <Field
                      name="date"
                      label="Date of registration"
                      saveDateAsString
                      component={DateField}
                      required
                    />
                    <Field
                      name="clinicianId"
                      label="Registered by"
                      component={AutocompleteField}
                      suggester={registeredBySuggester}
                      required
                    />
                  </FormGrid>
                  <FormGrid style={{ gridColumn: 'span 2' }}>
                    <Field
                      name="facilityId"
                      label="Registering facility"
                      component={AutocompleteField}
                      suggester={registeringFacilitySuggester}
                      required
                    />
                    <Field
                      name="clinicalStatusId"
                      label="Status"
                      component={AutocompleteField}
                      suggester={programRegistryStatusSuggester}
                    />
                  </FormGrid>
                  <FormGrid style={{ gridColumn: 'span 2' }}>
                    <Field
                      tooltipText="Select a program registry to add conditions"
                      name="conditions"
                      label="Conditions"
                      component={MultiselectField}
                      options={conditions}
                      disabled={!conditions}
                    />
                  </FormGrid>
                  <ConfirmCancelRow
                    onCancel={handleCancel}
                    onConfirm={submitForm}
                    confirmText="Confirm"
                  />
                </FormGrid>
              </div>
            );
          }}
          initialValues={{
            date: getCurrentDateTimeString(),
            facilityId: facility.id,
            clinicianId: currentUser.id,
            ...patientProgramRegistration,
          }}
          validationSchema={yup.object().shape({
            clinicalStatusId: optionalForeignKey(),
            date: yup.date().required('Date of registration must be selected'),
            clinicianId: foreignKey().required('Registered by must be selected'),
            facilityId: foreignKey().required('Registering facility must be selected'),
            conditions: yup.array().of(yup.string()),
          })}
        />
      </Modal>
    );
  },
);

ActivatePatientProgramRegistry.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  patientProgramRegistration: PropTypes.shape({ id: PropTypes.string }).isRequired,
  open: PropTypes.bool.isRequired,
};
