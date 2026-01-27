import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import * as yup from 'yup';
import { REGISTRATION_STATUSES, FORM_TYPES } from '@tamanu/constants';
import { useSelector } from 'react-redux';
import { Form, FormGrid, useDateTimeFormat } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import {
  AutocompleteField,
  DateField,
  Field,
  FieldWithTooltip,
  ArrayField,
} from '../../components/Field';
import {
  ProgramRegistryConditionField,
  ProgramRegistryConditionCategoryField,
} from '../../features/ProgramRegistry';
import { ModalFormActionRow, TranslatedText } from '../../components';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { useSuggester } from '../../api';
import { useProgramRegistryQuery } from '../../api/queries';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';

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
  const { getCountryCurrentDateTimeString } = useDateTimeFormat();

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
              conditionCategoryId: yup
                .string()
                .nullable()
                .when('conditionId', {
                  is: value => Boolean(value),
                  then: yup
                    .string()
                    .required(getTranslation('validation.required.inline', '*Required')),
                }),
            }),
          )
          .nullable(),
        programRegistryId: foreignKey().required(
          getTranslation('validation.required.inline', '*Required'),
        ),
        clinicalStatusId: optionalForeignKey().nullable(),
        date: yup.date(),
        clinicianId: foreignKey().required(
          getTranslation('validation.required.inline', '*Required'),
        ),
        registeringFacilityId: foreignKey().required(
          getTranslation('validation.required.inline', '*Required'),
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
              data.conditions.filter(condition => condition?.conditionId)
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
                      stringId="programRegistry.programRegistry.label"
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
                      stringId="programRegistry.registrationDate.label"
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
                      stringId="programRegistry.registeredBy.label"
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
                      stringId="programRegistry.registeringFacility.label"
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
                  disabledTooltipText={
                    <TranslatedText
                      stringId="programRegistry.registryForm.clinicalStatus.disabledTooltip"
                      fallback="Select a program registry to set the status"
                    />
                  }
                  name="clinicalStatusId"
                  label={
                    <TranslatedText
                      stringId="programRegistry.clinicalStatus.label"
                      fallback="Status"
                    />
                  }
                  placeholder={getTranslation('general.placeholder.select', 'Select')}
                  component={AutocompleteField}
                  suggester={programRegistryStatusSuggester}
                  disabled={!program}
                />
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

                    let usedValues = [];

                    if (values?.conditions) {
                      usedValues = values.conditions
                        ?.filter(
                          condition =>
                            condition?.conditionId &&
                            condition?.conditionId !== conditionValue?.conditionId,
                        )
                        ?.map(condition => condition.conditionId);
                    }

                    return (
                      <RelatedConditionFieldsContainer>
                        <ProgramRegistryConditionField
                          name={`${fieldName}.conditionId`}
                          programRegistryId={selectedProgramRegistryId}
                          onClear={onClear}
                          optionsFilter={condition => !usedValues.includes(condition.id)}
                          label={
                            <TranslatedText
                              stringId="programRegistry.relatedConditions.label"
                              fallback="Related conditions"
                            />
                          }
                        />
                        <ProgramRegistryConditionCategoryField
                          name={`${fieldName}.conditionCategoryId`}
                          isInitialRegistration={!editedObject?.id}
                          programRegistryId={selectedProgramRegistryId}
                          disabled={!conditionValue?.conditionId}
                          disabledTooltipText={getTranslation(
                            'programRegistry.relatedConditionsCategory.tooltip',
                            'Select a condition to add related categories',
                          )}
                          required={Boolean(conditionValue?.conditionId)}
                          label={
                            <TranslatedText
                              stringId="programRegistry.relatedConditionsCategory.label"
                              fallback="Category"
                            />
                          }
                        />
                      </RelatedConditionFieldsContainer>
                    );
                  }}
                />
              </FormGrid>
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
        date: getCountryCurrentDateTimeString(),
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
