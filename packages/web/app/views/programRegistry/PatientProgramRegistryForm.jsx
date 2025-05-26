import React, { useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { Divider } from '@material-ui/core';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  AutocompleteField,
  BaseMultiselectField,
  DateField,
  Field,
  FieldWithTooltip,
  Form,
} from '../../components/Field';
import { FormGrid } from '../../components/FormGrid';
import {
  ConfirmCancelRow,
  getReferenceDataStringId,
  TranslatedReferenceData,
  TranslatedText,
} from '../../components';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../../api/useApi';
import { useTranslation } from '../../contexts/Translation';
import { FORM_TYPES } from '../../constants';
import { useProgramRegistryConditionsQuery } from '../../api/queries/usePatientProgramRegistryConditionsQuery';

export const PatientProgramRegistryForm = ({ onCancel, onSubmit, editedObject }) => {
  const api = useApi();
  const { getTranslation } = useTranslation();
  const { currentUser, facilityId } = useAuth();
  const patient = useSelector((state) => state.patient);
  const [selectedProgramRegistryId, setSelectedProgramRegistryId] = useState();

  const { data: program } = useQuery(['programRegistry', selectedProgramRegistryId], () =>
    selectedProgramRegistryId ? api.get(`programRegistry/${selectedProgramRegistryId}`) : null,
  );
  const { data: conditions = [] } = useProgramRegistryConditionsQuery(selectedProgramRegistryId);
  const programRegistrySuggester = useSuggester('programRegistry', {
    baseQueryParameters: { patientId: patient.id },
  });
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: program ? program.id : null },
  });
  const registeredBySuggester = useSuggester('practitioner');
  const registeringFacilitySuggester = useSuggester('facility');

  return (
    <Form
      showInlineErrorsOnly
      onSubmit={async (data) => {
        return onSubmit({
          ...data,
          conditionIds: data.conditionIds ? JSON.parse(data.conditionIds) : [],
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          patientId: patient.id,
        });
      }}
      render={({ submitForm, values, setValues }) => {
        const handleCancel = () => onCancel && onCancel();
        const getButtonText = (isCompleted) => {
          if (isCompleted) return 'Finalise';
          if (editedObject?.id) return 'Update';
          return 'Submit';
        };

        const isCompleted = !!values.completed;
        const buttonText = getButtonText(isCompleted);

        return (
          <div>
            <FormGrid
              style={{ paddingLeft: '32px', paddingRight: '32px' }}
              data-testid="formgrid-69rn"
            >
              <FormGrid style={{ gridColumn: 'span 2' }} data-testid="formgrid-hjfz">
                <Field
                  name="programRegistryId"
                  label={
                    <TranslatedText
                      stringId="programRegistry.programRegistry.label"
                      fallback="Program registry"
                      data-testid="translatedtext-8r1b"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  required
                  component={AutocompleteField}
                  suggester={programRegistrySuggester}
                  onChange={(event) => {
                    if (selectedProgramRegistryId !== event.target.value) {
                      setValues({ ...values, clinicalStatusId: null, conditions: null });
                      setSelectedProgramRegistryId(event.target.value);
                    }
                  }}
                  data-testid="field-7obg"
                />
                <Field
                  name="date"
                  label={
                    <TranslatedText
                      stringId="programRegistry.registrationDate.label"
                      fallback="Date of registration"
                      data-testid="translatedtext-ufg3"
                    />
                  }
                  saveDateAsString
                  required
                  component={DateField}
                  data-testid="field-shvm"
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }} data-testid="formgrid-q6bs">
                <Field
                  name="clinicianId"
                  label={
                    <TranslatedText
                      stringId="programRegistry.registeredBy.label"
                      fallback="Registered by"
                      data-testid="translatedtext-2k8k"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  required
                  component={AutocompleteField}
                  suggester={registeredBySuggester}
                  data-testid="field-lau7"
                />
                <Field
                  name="registeringFacilityId"
                  label={
                    <TranslatedText
                      stringId="programRegistry.registeringFacility.label"
                      fallback="Registering facility"
                      data-testid="translatedtext-wsci"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  required
                  component={AutocompleteField}
                  suggester={registeringFacilitySuggester}
                  data-testid="field-3s4y"
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }} data-testid="formgrid-icsp">
                <FieldWithTooltip
                  disabledTooltipText={
                    <TranslatedText
                      stringId="programRegistry.registryForm.clinicalStatus.disabledTooltip"
                      fallback="Select a program registry to set the status"
                      data-testid="translatedtext-vhlb"
                    />
                  }
                  name="clinicalStatusId"
                  label={
                    <TranslatedText
                      stringId="programRegistry.clinicalStatus.label"
                      fallback="Status"
                      data-testid="translatedtext-qo8f"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  component={AutocompleteField}
                  suggester={programRegistryStatusSuggester}
                  disabled={!program}
                  data-testid="fieldwithtooltip-e4px"
                />
                <FieldWithTooltip
                  disabledTooltipText={
                    !conditions ? (
                      <TranslatedText
                        stringId="programRegistry.registryForm.relatedConditions.disabledTooltip"
                        fallback="Select a program registry to add related conditions"
                        data-testid="translatedtext-a1c7"
                      />
                    ) : (
                      <TranslatedText
                        stringId="programRegistry.registryForm.relatedConditions.noConditionsTooltip"
                        fallback="No conditions have been configured for this program registry"
                        data-testid="translatedtext-obax"
                      />
                    )
                  }
                  name="conditionIds"
                  label={
                    <TranslatedText
                      stringId="programRegistry.relatedConditions.label"
                      fallback="Related conditions"
                      data-testid="translatedtext-5f8m"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  component={BaseMultiselectField}
                  options={conditions?.map?.((condition) => ({
                    label: (
                      <TranslatedReferenceData
                        fallback={condition.name}
                        value={condition.id}
                        category="programRegistryCondition"
                        data-testid={`translatedreferencedata-lrzc-${condition.code}`}
                      />
                    ),
                    value: condition.id,
                    searchString: getTranslation(
                      getReferenceDataStringId(condition.id, 'programRegistryCondition'),
                      condition.name,
                    ),
                  }))}
                  disabled={!conditions || conditions.length === 0}
                  data-testid="fieldwithtooltip-ca2k"
                />
              </FormGrid>
            </FormGrid>
            <Divider
              style={{
                gridColumn: '1 / -1',
                marginTop: '30px',
                marginBottom: '30px',
              }}
              data-testid="divider-5h1b"
            />
            <ConfirmCancelRow
              style={{ paddingLeft: '32px', paddingRight: '32px' }}
              onCancel={handleCancel}
              onConfirm={submitForm}
              confirmText={buttonText}
              data-testid="confirmcancelrow-qpmx"
            />
          </div>
        );
      }}
      initialValues={{
        date: getCurrentDateTimeString(),
        registeringFacilityId: facilityId,
        clinicianId: currentUser.id,
        ...editedObject,
      }}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        programRegistryId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="programRegistry.programRegistry.label"
            fallback="Program registry"
            data-testid="translatedtext-0ili"
          />,
        ),
        clinicalStatusId: optionalForeignKey().nullable(),
        date: yup.date(),
        clinicianId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="programRegistry.registeredBy.label"
            fallback="Registered by"
            data-testid="translatedtext-25an"
          />,
        ),
        registeringFacilityId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="programRegistry.registeringFacility.label"
            fallback="Registering facility"
            data-testid="translatedtext-z0ih"
          />,
        ),
      })}
      data-testid="form-un0j"
    />
  );
};

PatientProgramRegistryForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

PatientProgramRegistryForm.defaultProps = {
  editedObject: null,
};
