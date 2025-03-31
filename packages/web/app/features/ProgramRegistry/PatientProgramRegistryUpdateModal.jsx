import React from 'react';
import styled from 'styled-components';
import {
  Modal,
  TranslatedText,
  Field,
  AutocompleteField,
  ModalFormActionRow,
} from '../../components';
import { useSuggester } from '../../api';
import { useUpdateProgramRegistryMutation } from '../../api/mutations';
import { RelatedConditionsForm } from './RelatedConditionsForm';

const StyledAutocompleteField = styled(AutocompleteField)`
  width: 300px;
`;

export const PatientProgramRegistryUpdateModal = ({
  patientProgramRegistration = {},
  onClose,
  open,
}) => {
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
        patientProgramRegistration={patientProgramRegistration}
        onSubmit={submit}
        FormActions={({ isDirty }) => (
          <ModalFormActionRow confirmDisabled={!isDirty || isSubmitting} />
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
