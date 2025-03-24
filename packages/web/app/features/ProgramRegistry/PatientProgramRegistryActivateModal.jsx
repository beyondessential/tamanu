import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { difference } from 'lodash';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { useQueryClient } from '@tanstack/react-query';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { AutocompleteField, DateField, Field } from '../../components/Field';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { TranslatedReferenceData, TranslatedText } from '../../components';
import { useSuggester } from '../../api';
import { Modal } from '../../components/Modal';
import { useApi } from '../../api/useApi';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';
import { usePatientProgramRegistryConditionsQuery } from '../../api/queries';
import { RelatedConditionsForm } from './RelatedConditionsForm';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';

export const FormGrid = styled.div`
  display: flex;
  gap: 1rem;
`;

export const PatientProgramRegistryActivateModal = ({
  onClose,
  patientProgramRegistration,
  open,
}) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { getTranslation } = useTranslation();
  const { currentUser, facilityId } = useAuth();
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: patientProgramRegistration.programRegistryId },
  });
  const {
    data: registrationConditions,
    isLoading: isPatientConditionsLoading,
  } = usePatientProgramRegistryConditionsQuery(
    patientProgramRegistration.patientId,
    patientProgramRegistration.programRegistryId,
  );

  const registeredBySuggester = useSuggester('practitioner');
  const registeringFacilitySuggester = useSuggester('facility');

  const activate = async data => {
    const { ...rest } = data;
    delete rest.id;
    delete rest.date;

    // Extract condition IDs from registrationConditions.data and data
    const existingConditionIds = registrationConditions.map(
      condition => condition.programRegistryConditionId,
    );
    const incomingConditionIds =
      typeof data.conditionIds === 'string' ? JSON.parse(data.conditionIds) : data.conditionIds;

    // Identify conditions to remove and their corresponding objects
    const conditionsToRemove = difference(existingConditionIds, incomingConditionIds);
    const conditionsToRemoveObjects = registrationConditions.filter(condition =>
      conditionsToRemove.includes(condition.programRegistryConditionId),
    );

    // Remove conditions
    const deletionDate = getCurrentDateTimeString();
    for (const conditionToRemove of conditionsToRemoveObjects) {
      await api.delete(
        `patient/${encodeURIComponent(
          patientProgramRegistration.patientId,
        )}/programRegistration/${encodeURIComponent(
          patientProgramRegistration.programRegistryId,
        )}/condition/${encodeURIComponent(conditionToRemove.id)}`,
        { deletionDate },
      );
    }

    // Identify new condition IDs
    const newConditionIds = difference(incomingConditionIds, existingConditionIds);

    // Activate program registration with updated conditions
    await api.post(
      `patient/${encodeURIComponent(patientProgramRegistration.patientId)}/programRegistration`,
      {
        ...rest,
        date: getCurrentDateTimeString(),
        conditionIds: newConditionIds,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
      },
    );

    // Invalidate queries and close modal
    queryClient.invalidateQueries([`infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`]);
    queryClient.invalidateQueries(['patient', patientProgramRegistration.patientId]);
    onClose();
  };

  if (isPatientConditionsLoading) return null;

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
        onSubmit={activate}
        isSubmitting={false}
        onClose={onClose}
        initialValues={{
          registeringFacilityId: facilityId,
          clinicianId: currentUser?.id,
          clinicalStatusId: patientProgramRegistration.clinicalStatus?.id,
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
