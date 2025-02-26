import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { foreignKey } from '../utils/validation';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  Form,
  FormGrid,
  FormSubmitButton,
  LocalisedField,
  LocalisedLocationField,
  LocationAvailabilityWarningMessage,
  BaseSelectField,
  SuggesterSelectField,
  TextField,
} from '../components';
import { ENCOUNTER_OPTIONS, FORM_TYPES, REASON_FOR_ENCOUNTER_MAX_CHARACTERS } from '../constants';
import { useSuggester } from '../api';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { isInpatient } from '../utils/isInpatient';
import { useTranslation } from '../contexts/Translation';

export const EncounterForm = React.memo(
  ({ editedObject, onSubmit, patientBillingTypeId, encounterType, initialValues }) => {
    const practitionerSuggester = useSuggester('practitioner');
    const departmentSuggester = useSuggester('department', {
      baseQueryParameters: { filterByFacility: true },
    });
    const referralSourceSuggester = useSuggester('referralSource');
    const { getTranslation } = useTranslation();

    const renderForm = ({ submitForm, values }) => {
      const buttonText = editedObject ? (
        <TranslatedText
          stringId="patient.modal.checkIn.action.update"
          fallback="Update encounter"
        />
      ) : (
        <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
      );

      return (
        <FormGrid>
          <Field
            name="encounterType"
            label={
              <TranslatedText
                stringId="patient.modal.checkIn.encounterType.label"
                fallback="Encounter type"
              />
            }
            disabled
            component={BaseSelectField}
            options={ENCOUNTER_OPTIONS}
          />
          <Field
            name="startDate"
            label={
              <TranslatedText
                stringId="patient.modal.checkIn.checkInDate.label"
                fallback="Check-in date"
              />
            }
            required
            min="1970-01-01T00:00"
            component={DateTimeField}
            saveDateAsString
          />
          <Field
            name="departmentId"
            label={<TranslatedText stringId="general.department.label" fallback="Department" />}
            required
            component={AutocompleteField}
            suggester={departmentSuggester}
          />
          <Field
            name="examinerId"
            label={
              <TranslatedText
                stringId="general.localisedField.clinician.label.short"
                fallback="Clinician"
              />
            }
            required
            component={AutocompleteField}
            suggester={practitionerSuggester}
          />
          <Field name="locationId" component={LocalisedLocationField} required />
          <LocationAvailabilityWarningMessage
            locationId={values?.locationId}
            style={{
              gridColumn: '2',
              marginTop: '-1.2rem',
              fontSize: '12px',
            }}
          />
          <LocalisedField
            name="referralSourceId"
            label={
              <TranslatedText
                stringId="general.localisedField.referralSourceId.label"
                fallback="Referral source"
              />
            }
            suggester={referralSourceSuggester}
            component={AutocompleteField}
          />
          <LocalisedField
            name="patientBillingTypeId"
            label={
              <TranslatedText
                stringId="general.localisedField.patientBillingTypeId.label"
                fallback="Patient type"
              />
            }
            endpoint="patientBillingType"
            component={SuggesterSelectField}
          />
          {isInpatient(encounterType) && (
            <LocalisedField
              name="dietIds"
              label={
                <TranslatedText stringId="general.localisedField.dietId.label" fallback="Diet" />
              }
              endpoint="diet"
              component={SuggesterSelectField}
              isMulti
              style={{ gridColumn: 'span 2' }}
            />
          )}
          <Field
            name="reasonForEncounter"
            label={
              <TranslatedText
                stringId="encounter.reasonForEncounter.label"
                fallback="Reason for encounter"
              />
            }
            component={TextField}
            multiline
            minRows={2}
            style={{ gridColumn: 'span 2' }}
          />
          <div style={{ gridColumn: 2, textAlign: 'right' }}>
            <FormSubmitButton variant="contained" onSubmit={submitForm} color="primary">
              {buttonText}
            </FormSubmitButton>
          </div>
        </FormGrid>
      );
    };

    return (
      <Form
        onSubmit={onSubmit}
        render={renderForm}
        initialValues={{
          startDate: getCurrentDateTimeString(),
          encounterType,
          patientBillingTypeId,
          ...editedObject,
          ...initialValues,
        }}
        formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        validationSchema={yup.object().shape({
          examinerId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
            />,
          ),
          locationId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.localisedField.locationId.label"
              fallback="Location"
            />,
          ),
          departmentId: foreignKey().translatedLabel(
            <TranslatedText stringId="general.department.label" fallback="Department" />,
          ),
          startDate: yup
            .date()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="patient.modal.checkIn.checkInDate.label"
                fallback="Check-in date"
              />,
            ),
          encounterType: yup
            .string()
            .oneOf(ENCOUNTER_OPTIONS.map(x => x.value))
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="patient.modal.checkIn.encounterType.label"
                fallback="Encounter type"
              />,
            ),
          reasonForEncounter: yup
            .string()
            .max(
              REASON_FOR_ENCOUNTER_MAX_CHARACTERS,
              getTranslation(
                'reasonForEncounter.validation.rule.maxNCharacters',
                'Reason for encounter must not exceed :maxChars characters',
                { replacements: { maxChars: REASON_FOR_ENCOUNTER_MAX_CHARACTERS } },
              ),
            ),
        })}
      />
    );
  },
);

EncounterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
