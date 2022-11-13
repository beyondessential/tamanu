import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
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
  SuggesterSelectField,
  DateTimeField,
} from '../components';
import { encounterOptions } from '../constants';
import { useSuggester } from '../api';

export const EncounterForm = React.memo(
  ({ editedObject, onSubmit, patientBillingTypeId, encounterType }) => {
    const locationSuggester = useSuggester('location', {
      baseQueryParameters: { filterByFacility: true },
    });
    const practitionerSuggester = useSuggester('practitioner');
    const departmentSuggester = useSuggester('department', {
      baseQueryParameters: { filterByFacility: true },
    });
    const referralSourceSuggester = useSuggester('referralSource');

    const renderForm = ({ submitForm }) => {
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
            name="locationId"
            label="Location"
            required
            component={AutocompleteField}
            suggester={locationSuggester}
          />
          <Field
            name="examinerId"
            label="Practitioner"
            required
            component={AutocompleteField}
            suggester={practitionerSuggester}
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
          examinerId: foreignKey('Examiner is required'),
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
