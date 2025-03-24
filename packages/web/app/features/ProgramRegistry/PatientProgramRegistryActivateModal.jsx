import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { AutocompleteField, DateField, Field } from '../../components/Field';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { ModalFormActionRow, TranslatedReferenceData, TranslatedText } from '../../components';
import { useSuggester } from '../../api';
import { Modal } from '../../components/Modal';
import { useApi } from '../../api/useApi';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';
import { RelatedConditionsForm } from './RelatedConditionsForm';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';

export const FormGrid = styled.div`
  display: flex;
  gap: 1rem;
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

export const PatientProgramRegistryActivateModal = ({
  patientProgramRegistration = {},
  onClose,
  open,
}) => {
  const { id: registrationId, patientId } = patientProgramRegistration;
  const { getTranslation } = useTranslation();
  const { currentUser, facilityId } = useAuth();
  const { mutateAsync: onSubmit, isLoading: isSubmitting } = useUpdateProgramRegistryMutation(
    patientId,
    registrationId,
  );

  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: patientProgramRegistration.programRegistryId },
  });
  const registeredBySuggester = useSuggester('practitioner');
  const registeringFacilitySuggester = useSuggester('facility');

  return (
    <Modal
      title={
        <>
          <TranslatedText stringId="programRegistry.activate.title" fallback="Activate" />{' '}
          <TranslatedReferenceData
            fallback={patientProgramRegistration.programRegistry.name}
            value={patientProgramRegistration.programRegistry.id}
            category="programRegistry"
          />
        </>
      }
      open={open}
      width="lg"
      onClose={onClose}
    >
      <RelatedConditionsForm
        patientProgramRegistration={patientProgramRegistration}
        onSubmit={onSubmit}
        onClose={onClose}
        FormActions={() => <ModalFormActionRow confirmDisabled={isSubmitting} />}
        initialValues={{
          registeringFacilityId: facilityId,
          clinicianId: currentUser?.id,
          clinicalStatusId: patientProgramRegistration.clinicalStatus?.id,
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        }}
        validationSchema={{
          clinicalStatusId: optionalForeignKey().nullable(),
          date: yup.date().required(getTranslation('validation.required.inline', '*Required')),
          clinicianId: foreignKey().required(
            getTranslation('validation.required.inline', '*Required'),
          ),
          registeringFacilityId: foreignKey().required(
            getTranslation('validation.required.inline', '*Required'),
          ),
        }}
      >
        <FormGrid>
          <Field
            name="date"
            label={
              <TranslatedText
                stringId="programRegistry.registrationDate.label"
                fallback="Date of registration"
              />
            }
            saveDateAsString
            component={DateField}
            required
          />
          <Field
            name="clinicianId"
            label={
              <TranslatedText
                stringId="programRegistry.registeredBy.label"
                fallback="Registered by"
              />
            }
            component={AutocompleteField}
            suggester={registeredBySuggester}
            required
          />
          <Field
            name="registeringFacilityId"
            label={
              <TranslatedText
                stringId="programRegistry.registeringFacility.label"
                fallback="Registering facility"
              />
            }
            component={AutocompleteField}
            suggester={registeringFacilitySuggester}
            required
          />
          <Field
            name="clinicalStatusId"
            label={
              <TranslatedText stringId="programRegistry.clinicalStatus.label" fallback="Status" />
            }
            component={AutocompleteField}
            suggester={programRegistryStatusSuggester}
          />
        </FormGrid>
      </RelatedConditionsForm>
    </Modal>
  );
};
