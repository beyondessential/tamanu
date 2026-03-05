import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { AutocompleteField, DateField, Field } from '../../components/Field';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { ModalFormActionRow } from '../../components/ModalActionRow';
import { TranslatedReferenceData, TranslatedText, Modal } from '@tamanu/ui-components';
import { useSuggester } from '../../api';
import { RelatedConditionsForm } from './RelatedConditionsForm';  
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { useUpdateProgramRegistryMutation } from '../../api/mutations';

const FormGrid = styled.div`
  display: flex;
  gap: 1rem;
`;

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
