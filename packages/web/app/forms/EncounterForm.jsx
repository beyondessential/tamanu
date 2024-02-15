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
  SelectField,
  SuggesterSelectField,
  TextField,
  useLocalisedText,
} from '../components';
import { FORM_TYPES, encounterOptions } from '../constants';
import { useSuggester } from '../api';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const EncounterForm = React.memo(
  ({ editedObject, onSubmit, patientBillingTypeId, encounterType }) => {
    const practitionerSuggester = useSuggester('practitioner');
    const departmentSuggester = useSuggester('department', {
      baseQueryParameters: { filterByFacility: true },
    });
    const referralSourceSuggester = useSuggester('referralSource');
    const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });

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
                stringId="patient.modal.checkIn.form.encounterType.label"
                fallback="Encounter type"
              />
            }
            disabled
            component={SelectField}
            options={encounterOptions}
          />
          <Field
            name="startDate"
            label={
              <TranslatedText
                stringId="patient.modal.checkIn.form.checkInDate.label"
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
              <TranslatedText stringId="general.form.department.label" fallback="Department" />
            }
            required
            component={AutocompleteField}
            suggester={departmentSuggester}
          />
          <Field
            name="examinerId"
            label={clinicianText}
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
            suggester={referralSourceSuggester}
            component={AutocompleteField}
          />
          <LocalisedField
            name="patientBillingTypeId"
            endpoint="patientBillingType"
            component={SuggesterSelectField}
          />
          <Field
            name="reasonForEncounter"
            label={
              <TranslatedText
                stringId="modal.checkIn.form.reasonForEncounter.label"
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
        formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        validationSchema={yup.object().shape({
          examinerId: foreignKey(`${clinicianText} is required`),
          locationId: foreignKey('Location is required'),
          departmentId: foreignKey('Department is required'),
          startDate: yup.date().required(),
          encounterType: yup
            .string()
            .oneOf(encounterOptions.map(x => x.value))
            .required(),
        })}
      />
    );
  },
);

EncounterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
