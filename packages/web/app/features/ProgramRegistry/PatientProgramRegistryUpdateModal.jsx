import React from 'react';
import styled from 'styled-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, TranslatedText, Field, AutocompleteField } from '../../components';
import { useApi, useSuggester } from '../../api';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';
import { RelatedConditionsForm } from './RelatedConditionsForm';

const StyledAutocompleteField = styled(AutocompleteField)`
  width: 300px;
`;

const useUpdateProgramRegistryMutation = (patientId, registrationId) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    data => {
      return api.put(`patient/programRegistration/${registrationId}`, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([`infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`]);
        queryClient.invalidateQueries(['patient', patientId]);
      },
    },
  );
};

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
        isSubmitting={isSubmitting}
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
