import React from 'react';
import * as yup from 'yup';
import { difference } from 'lodash';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useQueryClient } from '@tanstack/react-query';
import { Divider } from '@material-ui/core';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import {
  AutocompleteField,
  DateField,
  Field,
  FieldWithTooltip,
  Form,
  MultiselectField,
} from '../../components/Field';
import { FormGrid } from '../../components/FormGrid';
import { ConfirmCancelRow } from '../../components/ButtonRow';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { Modal } from '../../components/Modal';
import { useApi } from '../../api/useApi';
import { PROGRAM_REGISTRY } from '../../components/PatientInfoPane/paneTitles';
import {
  usePatientProgramRegistryConditionsQuery,
  useProgramRegistryConditionsQuery,
} from '../../api/queries/usePatientProgramRegistryConditions';

export const ActivatePatientProgramRegistry = ({ onClose, patientProgramRegistration, open }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser, facility } = useAuth();
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: patientProgramRegistration.programRegistryId },
  });
  const { data: registrationConditions } = usePatientProgramRegistryConditionsQuery(
    patientProgramRegistration.patientId,
    patientProgramRegistration.programRegistryId,
  );
  const { data: conditions } = useProgramRegistryConditionsQuery(
    patientProgramRegistration.programRegistryId,
  );

  const registeredBySuggester = useSuggester('practitioner');
  const registeringFacilitySuggester = useSuggester('facility');

  const activate = async data => {
    const { ...rest } = data;
    delete rest.id;
    delete rest.date;

    // Extract condition IDs from registrationConditions.data and data
    const existingConditionIds = registrationConditions.data.map(
      condition => condition.programRegistryConditionId,
    );
    const incomingConditionIds =
      typeof data.conditionIds === 'string' ? JSON.parse(data.conditionIds) : data.conditionIds;

    // Identify conditions to remove and their corresponding objects
    const conditionsToRemove = difference(existingConditionIds, incomingConditionIds);
    const conditionsToRemoveObjects = registrationConditions.data.filter(condition =>
      conditionsToRemove.includes(condition.programRegistryConditionId),
    );

    // Remove conditions
    for (const conditionToRemove of conditionsToRemoveObjects) {
      await api.delete(
        `patient/${encodeURIComponent(
          patientProgramRegistration.patientId,
        )}/programRegistration/${encodeURIComponent(
          patientProgramRegistration.programRegistryId,
        )}/condition/${encodeURIComponent(conditionToRemove.id)}`,
      );
    }

    // Identify new condition IDs
    const newConditionIds = difference(incomingConditionIds, existingConditionIds);

    // Activate program registration with updated conditions
    await api.post(
      `patient/${encodeURIComponent(patientProgramRegistration.patientId)}/programRegistration`,
      {
        ...rest,
        conditionIds: newConditionIds,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
      },
    );

    // Invalidate queries and close modal
    queryClient.invalidateQueries([`infoPaneListItem-${PROGRAM_REGISTRY}`]);
    onClose();
  };

  return (
    <Modal
      title={`Activate ${patientProgramRegistration.programRegistry.name}`}
      open={open}
      width="md"
      onClose={onClose}
      overrideContentPadding
    >
      <Form
        showInlineErrorsOnly
        onSubmit={activate}
        render={({ submitForm }) => {
          return (
            <div>
              <FormGrid style={{ paddingLeft: '32px', paddingRight: '32px' }}>
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
                    name="registeringFacilityId"
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
                  <FieldWithTooltip
                    disabledTooltipText={
                      !conditions
                        ? 'Select a program registry to add related conditions'
                        : 'No conditions have been configured for this program registry'
                    }
                    name="conditionIds"
                    label="Related conditions"
                    placeholder="Select"
                    component={MultiselectField}
                    options={conditions}
                    disabled={!conditions || conditions.length === 0}
                  />
                </FormGrid>
              </FormGrid>
              <Divider
                style={{
                  gridColumn: '1 / -1',
                  marginTop: '30px',
                  marginBottom: '30px',
                }}
              />
              <ConfirmCancelRow
                style={{ paddingLeft: '32px', paddingRight: '32px' }}
                onCancel={onClose}
                onConfirm={submitForm}
                confirmText="Confirm"
              />
            </div>
          );
        }}
        initialValues={{
          ...patientProgramRegistration,
          date: getCurrentDateTimeString(),
          registeringFacilityId: facility?.id,
          clinicianId: currentUser?.id,
          conditionIds: registrationConditions?.data.map(x => x.programRegistryConditionId),
          clinicalStatusId: patientProgramRegistration.clinicalStatus?.id,
        }}
        validationSchema={yup.object().shape({
          clinicalStatusId: optionalForeignKey().nullable(),
          date: yup.date().required('Date of registration must be selected'),
          clinicianId: foreignKey().required('Registered by must be selected'),
          registeringFacilityId: foreignKey().required('Registering facility must be selected'),
        })}
      />
    </Modal>
  );
};
