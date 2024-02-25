import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
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
import { ENCOUNTER_OPTIONS } from '../constants';
import { useSuggester } from '../api';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const EncounterForm = React.memo(
  ({ editedObject, onSubmit, patientBillingTypeId, encounterType }) => {
    const practitionerSuggester = useSuggester('practitioner');
    const departmentSuggester = useSuggester('department', {
      baseQueryParameters: { filterByFacility: true },
    });
    const referralSourceSuggester = useSuggester('referralSource');

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
            label={
              <TranslatedText stringId="general.department.label" fallback="Department" />
            }
            required
            component={AutocompleteField}
            suggester={departmentSuggester}
          />
          <Field
            name="examinerId"
            label={<TranslatedText stringId="general.localisedField.practitioner.label.short" />}
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
            prefix="general.localisedField.patientBillingTypeId"
          />
          <Field
            name="reasonForEncounter"
            label={
              <TranslatedText
                stringId="modal.checkIn.reasonForEncounter.label"
                fallback="Reason for encounter"
              />
            }
            component={TextField}
            multiline
            rows={2}
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
        }}
        validationSchema={yup.object().shape({
          examinerId: foreignKey('Required'),
          locationId: foreignKey('Location is required'),
          departmentId: foreignKey('Department is required'),
          startDate: yup.date().required(),
          encounterType: yup
            .string()
            .oneOf(ENCOUNTER_OPTIONS.map(x => x.value))
            .required(),
        })}
      />
    );
  },
);

EncounterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
