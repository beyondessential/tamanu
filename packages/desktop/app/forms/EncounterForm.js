import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { foreignKey } from '../utils/validation';
import {
  Form,
  Field,
  SelectField,
  AutocompleteField,
  TextField,
  Button,
  FormGrid,
  LocalisedField,
  DateTimeField,
  SuggesterSelectField,
  LocalisedLocationField,
  LocationAvailabilityWarningMessage,
  useLocalisedText,
} from '../components';
import { encounterOptions } from '../constants';
import { useSuggester } from '../api';

export const EncounterForm = React.memo(
  ({ editedObject, onSubmit, patientBillingTypeId, encounterType }) => {
    const practitionerSuggester = useSuggester('practitioner');
    const departmentSuggester = useSuggester('department', {
      baseQueryParameters: { filterByFacility: true },
    });
    const referralSourceSuggester = useSuggester('referralSource');
    const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });

    const renderForm = ({ submitForm, values }) => {
      const buttonText = editedObject ? 'Update encounter' : 'Confirm';

      return (
        <FormGrid>
          <Field
            name="encounterType"
            label="Encounter type"
            disabled
            component={SelectField}
            options={encounterOptions}
          />
          <Field
            name="startDate"
            label="Check-in date"
            required
            min="1970-01-01T00:00"
            component={DateTimeField}
            saveDateAsString
          />
          <Field
            name="departmentId"
            label="Department"
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
            label="Reason for encounter"
            component={TextField}
            multiline
            rows={2}
            style={{ gridColumn: 'span 2' }}
          />
          <div style={{ gridColumn: 2, textAlign: 'right' }}>
            <Button variant="contained" onClick={submitForm} color="primary">
              {buttonText}
            </Button>
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
