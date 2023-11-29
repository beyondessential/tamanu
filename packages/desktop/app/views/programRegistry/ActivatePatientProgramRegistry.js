import React from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { Form, Field, DateField, AutocompleteField } from '../../components/Field';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Field, DateField, AutocompleteField } from '../../components/Field';
import { FormGrid } from '../../components/FormGrid';
import { ConfirmCancelRow } from '../../components/ButtonRow';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { Modal } from '../../components/Modal';
import { useApi } from '../../api/useApi';
import { PROGRAM_REGISTRATION_STATUSES } from '../../constants';
import { FormSeparatorLine } from '../../components';

export const ActivatePatientProgramRegistry = ({ onClose, patientProgramRegistration, open }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser, facility } = useAuth();
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: patientProgramRegistration.programRegistryId },
  });
  const registeredBySuggester = useSuggester('practitioner');
  const registeringFacilitySuggester = useSuggester('facility');

  const activate = async data => {
    const { id, ...rest } = data;
    await api.post(
      `patient/${encodeURIComponent(patientProgramRegistration.patientId)}/programRegistration`,
      { ...rest, registrationStatus: PROGRAM_REGISTRATION_STATUSES.ACTIVE },
    );

    queryClient.invalidateQueries([`infoPaneListItem-Program Registry`]);
    onClose();
  };
  return (
    <Modal
      title={`Activate ${patientProgramRegistration.programRegistry.name} program registry`}
      open={open}
      width="md"
      onClose={onClose}
    >
      <Form
        onSubmit={activate}
        render={({ submitForm }) => {
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
                <FormSeparatorLine />
                <ConfirmCancelRow onCancel={onClose} onConfirm={submitForm} confirmText="Confirm" />
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
        })}
      />
    </Modal>
  );
};
