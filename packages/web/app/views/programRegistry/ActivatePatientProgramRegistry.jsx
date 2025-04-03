import React from 'react';
import * as yup from 'yup';
import { difference } from 'lodash';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
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
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';
import {
  usePatientProgramRegistryConditionsQuery,
  useProgramRegistryConditionsQuery,
} from '../../api/queries/usePatientProgramRegistryConditionsQuery';
import { useTranslation } from '../../contexts/Translation';
import { FORM_TYPES } from '../../constants';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { getReferenceDataStringId, TranslatedReferenceData } from '../../components';

export const ActivatePatientProgramRegistry = ({ onClose, patientProgramRegistration, open }) => {
  const api = useApi();
  const queryClient = useQueryClient();
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
  const { data: conditions, isLoading: isConditionsLoading } = useProgramRegistryConditionsQuery(
    patientProgramRegistration.programRegistryId,
  );
  const { getTranslation } = useTranslation();

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
    onClose();
  };

  if (isPatientConditionsLoading || isConditionsLoading) return null;

  return (
    <Modal
      title={
        <>
          <TranslatedText
            stringId="programRegistry.activate.title"
            fallback="Activate"
            data-testid='translatedtext-n29q' />{' '}
          <TranslatedReferenceData
            fallback={patientProgramRegistration.programRegistry.name}
            value={patientProgramRegistration.programRegistry.id}
            category="programRegistry"
            data-testid='translatedreferencedata-cvni' />
        </>
      }
      open={open}
      width="md"
      onClose={onClose}
      overrideContentPadding
      data-testid='modal-zeab'>
      <Form
        showInlineErrorsOnly
        onSubmit={activate}
        render={({ submitForm }) => {
          return (
            <div>
              <FormGrid
                style={{ paddingLeft: '32px', paddingRight: '32px' }}
                data-testid='formgrid-9f1e'>
                <FormGrid style={{ gridColumn: 'span 2' }} data-testid='formgrid-4pzw'>
                  <Field
                    name="date"
                    label={
                      <TranslatedText
                        stringId="programRegistry.registrationDate.label"
                        fallback="Date of registration"
                        data-testid='translatedtext-yuoi' />
                    }
                    saveDateAsString
                    component={DateField}
                    required
                    data-testid='field-tch8' />
                  <Field
                    name="clinicianId"
                    label={
                      <TranslatedText
                        stringId="programRegistry.registeredBy.label"
                        fallback="Registered by"
                        data-testid='translatedtext-mlof' />
                    }
                    component={AutocompleteField}
                    suggester={registeredBySuggester}
                    required
                    data-testid='field-w7w6' />
                </FormGrid>
                <FormGrid style={{ gridColumn: 'span 2' }} data-testid='formgrid-rptq'>
                  <Field
                    name="registeringFacilityId"
                    label={
                      <TranslatedText
                        stringId="programRegistry.registeringFacility.label"
                        fallback="Registering facility"
                        data-testid='translatedtext-36x6' />
                    }
                    component={AutocompleteField}
                    suggester={registeringFacilitySuggester}
                    required
                    data-testid='field-w9lw' />
                  <Field
                    name="clinicalStatusId"
                    label={
                      <TranslatedText
                        stringId="programRegistry.clinicalStatus.label"
                        fallback="Status"
                        data-testid='translatedtext-3n56' />
                    }
                    component={AutocompleteField}
                    suggester={programRegistryStatusSuggester}
                    data-testid='field-a2v3' />
                </FormGrid>
                <FormGrid style={{ gridColumn: 'span 2' }} data-testid='formgrid-jcc7'>
                  <FieldWithTooltip
                    disabledTooltipText={
                      !conditions
                        ? 'Select a program registry to add related conditions'
                        : 'No conditions have been configured for this program registry'
                    }
                    name="conditionIds"
                    label={
                      <TranslatedText
                        stringId="programRegistry.relatedConditions.label"
                        fallback="Related conditions"
                        data-testid='translatedtext-6uhn' />
                    }
                    placeholder={getTranslation('general.placeholder.select', 'Select')}
                    component={MultiselectField}
                    options={conditions?.map(condition => ({
                      label: (
                        <TranslatedReferenceData
                          fallback={condition.name}
                          value={condition.id}
                          category="programRegistryCondition"
                          data-testid={`translatedreferencedata-cv46-${condition.code}`} />
                      ),
                      value: condition.id,
                      searchString: getTranslation(
                        getReferenceDataStringId(condition.id, 'programRegistryCondition'),
                        condition.name,
                      ),
                    }))}
                    disabled={!conditions || conditions.length === 0}
                    data-testid='fieldwithtooltip-h76w' />
                </FormGrid>
              </FormGrid>
              <Divider
                style={{
                  gridColumn: '1 / -1',
                  marginTop: '30px',
                  marginBottom: '30px',
                }}
                data-testid='divider-xakk' />
              <ConfirmCancelRow
                style={{ paddingLeft: '32px', paddingRight: '32px' }}
                onCancel={onClose}
                onConfirm={submitForm}
                data-testid='confirmcancelrow-fucf' />
            </div>
          );
        }}
        initialValues={{
          ...patientProgramRegistration,
          registeringFacilityId: facilityId,
          clinicianId: currentUser?.id,
          conditionIds: registrationConditions?.data.map(x => x.programRegistryConditionId),
          clinicalStatusId: patientProgramRegistration.clinicalStatus?.id,
        }}
        formType={FORM_TYPES.EDIT_FORM}
        validationSchema={yup.object().shape({
          clinicalStatusId: optionalForeignKey().nullable(),
          date: yup.date().required(getTranslation('validation.required.inline', '*Required')),
          clinicianId: foreignKey().required(
            getTranslation('validation.required.inline', '*Required'),
          ),
          registeringFacilityId: foreignKey().required(
            getTranslation('validation.required.inline', '*Required'),
          ),
        })}
        data-testid='form-4kxt' />
    </Modal>
  );
};
