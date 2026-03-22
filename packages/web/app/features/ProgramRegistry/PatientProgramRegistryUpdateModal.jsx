import React from 'react';
import styled from 'styled-components';
import { Modal, TranslatedText } from '@tamanu/ui-components';
import {
  Field,
  AutocompleteField,
  ModalFormActionRow,
} from '../../components';
import { useSuggester } from '../../api';
import { useUpdateProgramRegistryMutation } from '../../api/mutations';
import { RelatedConditionsForm } from './RelatedConditionsForm';
import { useAuth } from '../../contexts/Auth'

const StyledAutocompleteField = styled(AutocompleteField)`
  width: 300px;
`;

export const PatientProgramRegistryUpdateModal = ({
  patientProgramRegistration = {},
  onClose,
  open,
}) => {
  const { currentUser } = useAuth();
  const { id: registrationId, programRegistryId, patientId } = patientProgramRegistration;
  const { mutateAsync: submit, isLoading: isSubmitting } = useUpdateProgramRegistryMutation(
    patientId,
    registrationId,
  );

  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId },
  });

  return (
    <Modal
      title={
        <TranslatedText
          stringId="programRegistry.updateModal.title"
          fallback="Update program registry"
        />
      }
      open={open}
      onClose={onClose}
      width="lg"
    >
      <RelatedConditionsForm
        initialValues={{
          clinicianId: currentUser.id,
        }}
        patientProgramRegistration={patientProgramRegistration}
        onSubmit={submit}
        FormActions={({ isDirty }) => (
          <ModalFormActionRow confirmDisabled={!isDirty || isSubmitting} onCancel={onClose} />
        )}
        onClose={onClose}
      >
        <Field
          name="clinicalStatusId"
          label={<TranslatedText stringId="general.status.label" fallback="Status" />}
          component={StyledAutocompleteField}
          suggester={programRegistryStatusSuggester}
        />
      </RelatedConditionsForm>
    </Modal>
  );
};
