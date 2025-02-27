import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import * as yup from 'yup';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { useSelector } from 'react-redux';
import {
  AutocompleteField,
  DateField,
  Field,
  FieldWithTooltip,
  Form,
  ArrayField,
} from '../../components/Field';
import {
  ProgramRegistryConditionField,
  ProgramRegistryConditionCategoryField,
} from '../../features/ProgramRegistry';
import { FormGrid } from '../../components/FormGrid';
import { ModalFormActionRow, TranslatedText } from '../../components';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { useSuggester } from '../../api';
import { useProgramRegistryQuery } from '../../api/queries';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { Colors, FORM_TYPES } from '../../constants';

const RelatedConditionFieldsContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  grid-column: 1 / -1;
  border-top: 1px solid ${Colors.outline};
  padding-top: 8px;
  margin-top: -8px;

  > div {
    flex: 1;

    &:first-child {
      min-width: 50%;
    }
  }
`;

export const PatientProgramRegistryForm = ({ onCancel, onSubmit, editedObject }) => {
  const { getTranslation } = useTranslation();
  const { currentUser, facilityId } = useAuth();
  const patient = useSelector(state => state.patient);
  const [selectedProgramRegistryId, setSelectedProgramRegistryId] = useState();

  const { data: program } = useProgramRegistryQuery(selectedProgramRegistryId);

  const programRegistrySuggester = useSuggester('programRegistry', {
    baseQueryParameters: { patientId: patient.id },
  });
  const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
    baseQueryParameters: { programRegistryId: program ? program.id : null },
  });
  const registeredBySuggester = useSuggester('practitioner');
  const registeringFacilitySuggester = useSuggester('facility');

  const validationSchema = useMemo(
    () =>
      yup.object().shape({
        conditions: yup
          .array()
          .of(
            yup.object().shape({
              conditionId: yup.string().nullable(),
              category: yup
                .string()
                .nullable()
                .when('conditionId', {
                  is: value => Boolean(value),
                  then: yup
                    .string()
                    .required(
                      getTranslation(
                        'patientProgramRegistry.validation.rule.categoryRequiredWhenRelatedCondition',
                        'Category is required when a Related condition is set',
                      ),
                    ),
                }),
            }),
          )
          .nullable(),
        programRegistryId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="patientProgramRegistry.programRegistry.label"
            fallback="Program registry"
          />,
        ),
        clinicalStatusId: optionalForeignKey().nullable(),
        date: yup.date(),
        clinicianId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="patientProgramRegistry.registeredBy.label"
            fallback="Registered by"
          />,
        ),
        registeringFacilityId: foreignKey().translatedLabel(
          <TranslatedText
            stringId="patientProgramRegistry.registeringFacility.label"
            fallback="Registering facility"
          />,
        ),
      }),
    [getTranslation],
  );

  return (
    <Form
      showInlineErrorsOnly
      onSubmit={async data => {
        return onSubmit({
          ...data,
          conditions: data.conditions
            ? // Filter out empty conditions
              data.conditions.filter(condition => condition.conditionId)
            : [],
          registrationStatus: REGISTRATION_STATUSES.ACTIVE,
          patientId: patient.id,
        });
      }}
      render={({ submitForm, values, setValues }) => {
        const handleCancel = () => onCancel && onCancel();
        const getButtonText = isCompleted => {
          if (isCompleted) return 'Finalise';
          if (editedObject?.id) return 'Update';
          return 'Confirm';
        };

        const isCompleted = !!values.completed;
        const buttonText = getButtonText(isCompleted);

        return (
          <>
            <FormGrid style={{ paddingBottom: 30 }}>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="programRegistryId"
                  label={
                    <TranslatedText
                      stringId="patientProgramRegistry.programRegistry.label"
                      fallback="Program registry"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  required
                  component={AutocompleteField}
                  suggester={programRegistrySuggester}
                  onChange={event => {
                    if (selectedProgramRegistryId !== event.target.value) {
                      setValues({ ...values, clinicalStatusId: null, conditions: null });
                      setSelectedProgramRegistryId(event.target.value);
                    }
                  }}
                />
                <Field
                  name="date"
                  label={
                    <TranslatedText
                      stringId="patientProgramRegistry.date.label"
                      fallback="Date of registration"
                    />
                  }
                  saveDateAsString
                  required
                  component={DateField}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="clinicianId"
                  label={
                    <TranslatedText
                      stringId="patientProgramRegistry.registeredBy.label"
                      fallback="Registered by"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  required
                  component={AutocompleteField}
                  suggester={registeredBySuggester}
                />
                <Field
                  name="registeringFacilityId"
                  label={
                    <TranslatedText
                      stringId="patientProgramRegistry.registeringFacility.label"
                      fallback="Registering facility"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  required
                  component={AutocompleteField}
                  suggester={registeringFacilitySuggester}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <FieldWithTooltip
                  disabledTooltipText="Select a program registry to set the status"
                  name="clinicalStatusId"
                  label={<TranslatedText stringId="general.status.label" fallback="Status" />}
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  component={AutocompleteField}
                  suggester={programRegistryStatusSuggester}
                  disabled={!program}
                />
              </FormGrid>
              <Field
                name="conditions"
                component={ArrayField}
                renderField={index => {
                  const fieldName = `conditions[${index}]`;
                  const conditionValue = values?.conditions ? values?.conditions[index] : null;
                  const onClear = () => {
                    setValues({
                      ...values,
                      // Clear the condition and category fields. Set to an empty object rather than
                      // removing from the array keep the order of the conditions consistent with the fields
                      conditions: values.conditions.map((condition, i) =>
                        i === index ? {} : condition,
                      ),
                    });
                  };
                  return (
                    <RelatedConditionFieldsContainer>
                      <ProgramRegistryConditionField
                        name={`${fieldName}.conditionId`}
                        programRegistryId={selectedProgramRegistryId}
                        onClear={onClear}
                        label={
                          <TranslatedText
                            stringId="patientProgramRegistry.relatedConditions.label"
                            fallback="Related condition"
                          />
                        }
                      />
                      <ProgramRegistryConditionCategoryField
                        name={`${fieldName}.category`}
                        conditionId={conditionValue?.conditionId}
                        required={Boolean(conditionValue?.conditionId)}
                        label={
                          <TranslatedText
                            stringId="patientProgramRegistry.relatedConditionsCategory.label"
                            fallback="Category"
                          />
                        }
                      />
                    </RelatedConditionFieldsContainer>
                  );
                }}
              />
            </FormGrid>
            <ModalFormActionRow
              confirmText={buttonText}
              onConfirm={submitForm}
              onCancel={handleCancel}
            />
          </>
        );
      }}
      initialValues={{
        date: getCurrentDateTimeString(),
        registeringFacilityId: facilityId,
        clinicianId: currentUser.id,
        ...editedObject,
      }}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={validationSchema}
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
