import React from 'react';
import styled from 'styled-components';
import { CURRENTLY_AT_TYPES } from '@tamanu/constants';
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
  width: 267px;
`;

const FieldRow = styled.div`
  display: flex;
  gap: 20px;
`;

export const PatientProgramRegistryUpdateModal = ({
  patientProgramRegistration = {},
  onClose,
  open,
}) => {
  const { currentUser } = useAuth();
  const {
    id: registrationId,
    programRegistryId,
    patientId,
    programRegistry,
  } = patientProgramRegistration;
  const { mutateAsync: submit, isLoading: isSubmitting } = useUpdateProgramRegistryMutation(
    patientId,
    registrationId,
  );

  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId },
  });
  const facilitySuggester = useSuggester('facility');
  const villageSuggester = useSuggester('village');
  const isCurrentlyAtVillage = programRegistry?.currentlyAtType === CURRENTLY_AT_TYPES.VILLAGE;
  const currentlyInFieldName = isCurrentlyAtVillage ? 'villageId' : 'facilityId';

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
          [currentlyInFieldName]: patientProgramRegistration[currentlyInFieldName],
        }}
        patientProgramRegistration={patientProgramRegistration}
        onSubmit={submit}
        FormActions={({ isDirty }) => (
          <ModalFormActionRow confirmDisabled={!isDirty || isSubmitting} onCancel={onClose} />
        )}
        onClose={onClose}
      >
        <FieldRow>
          <Field
            name="clinicalStatusId"
            label={<TranslatedText stringId="general.status.label" fallback="Status" />}
            component={StyledAutocompleteField}
            suggester={programRegistryStatusSuggester}
          />
          <Field
            name={currentlyInFieldName}
            label={
              <TranslatedText
                stringId="programRegistry.currentlyIn.label"
                fallback="Currently in"
              />
            }
            component={StyledAutocompleteField}
            suggester={isCurrentlyAtVillage ? villageSuggester : facilitySuggester}
          />
        </FieldRow>
      </RelatedConditionsForm>
    </Modal>
  );
};
