import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import {
  TextField,
  TranslatedSelectField,
  Form,
  FormGrid,
  FormSubmitButton,
  useDateTimeFormat,
} from '@tamanu/ui-components';
import { foreignKey } from '../utils/validation';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  LocalisedField,
  LocalisedLocationField,
  LocationAvailabilityWarningMessage,
  SuggesterSelectField,
} from '../components';
import { ENCOUNTER_OPTIONS, REASON_FOR_ENCOUNTER_MAX_CHARACTERS } from '../constants';
import { useSuggester } from '../api';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { isInpatient } from '../utils/isInpatient';
import { useTranslation } from '../contexts/Translation';
import { ENCOUNTER_TYPE_LABELS, FORM_TYPES } from '@tamanu/constants';

export const EncounterForm = React.memo(
  ({ editedObject, onSubmit, patientBillingTypeId, encounterType, initialValues }) => {
    const practitionerSuggester = useSuggester('practitioner');
    const departmentSuggester = useSuggester('department', {
      baseQueryParameters: { filterByFacility: true },
    });
    const referralSourceSuggester = useSuggester('referralSource');
    const { getTranslation } = useTranslation();
    const { getCurrentDateTimeString } = useDateTimeFormat();

    const renderForm = ({ submitForm, values }) => {
      const buttonText = editedObject ? (
        <TranslatedText
          stringId="patient.modal.checkIn.action.update"
          fallback="Update encounter"
          data-testid="translatedtext-kvyn"
        />
      ) : (
        <TranslatedText
          stringId="general.action.confirm"
          fallback="Confirm"
          data-testid="translatedtext-0mav"
        />
      );

      return (
        <FormGrid data-testid="formgrid-ima9">
          <Field
            name="encounterType"
            label={
              <TranslatedText
                stringId="patient.modal.checkIn.encounterType.label"
                fallback="Encounter type"
                data-testid="translatedtext-59m8"
              />
            }
            disabled
            component={TranslatedSelectField}
            enumValues={ENCOUNTER_TYPE_LABELS}
            data-testid="field-t9el"
          />
          <Field
            name="startDate"
            label={
              isInpatient(encounterType) ? (
                <TranslatedText
                  stringId="patient.modal.checkIn.admissionDateTime.label"
                  fallback="Admission date & time"
                  data-testid="translatedtext-q4a8"
                />
              ) : (
                <TranslatedText
                  stringId="patient.modal.checkIn.checkInDateTime.label"
                  fallback="Check-in date & time"
                  data-testid="translatedtext-laie"
                />
              )
            }
            required
            min="1970-01-01T00:00"
            component={DateTimeField}
            saveDateAsString
            data-testid="field-vol8"
          />
          <Field
            name="departmentId"
            label={
              <TranslatedText
                stringId="general.department.label"
                fallback="Department"
                data-testid="translatedtext-re6p"
              />
            }
            required
            component={AutocompleteField}
            suggester={departmentSuggester}
            data-testid="field-gfz3"
          />
          <Field
            name="examinerId"
            label={
              <TranslatedText
                stringId="general.localisedField.clinician.label.short"
                fallback="Clinician"
                data-testid="translatedtext-bjbh"
              />
            }
            required
            component={AutocompleteField}
            suggester={practitionerSuggester}
            data-testid="field-o6eb"
          />
          <Field
            name="locationId"
            component={LocalisedLocationField}
            required
            data-testid="field-25q3"
          />
          <LocationAvailabilityWarningMessage
            locationId={values?.locationId}
            style={{
              gridColumn: '2',
              marginTop: '-1.2rem',
              fontSize: '12px',
            }}
            data-testid="locationavailabilitywarningmessage-s3pr"
          />
          <LocalisedField
            name="referralSourceId"
            label={
              <TranslatedText
                stringId="general.localisedField.referralSourceId.label"
                fallback="Referral source"
                data-testid="translatedtext-l1tw"
              />
            }
            suggester={referralSourceSuggester}
            component={AutocompleteField}
            data-testid="localisedfield-3vac"
          />
          <LocalisedField
            name="patientBillingTypeId"
            label={
              <TranslatedText
                stringId="general.localisedField.patientBillingTypeId.label"
                fallback="Patient type"
                data-testid="translatedtext-67v8"
              />
            }
            endpoint="patientBillingType"
            component={SuggesterSelectField}
            data-testid="localisedfield-amji"
          />
          {isInpatient(encounterType) && (
            <LocalisedField
              name="dietIds"
              label={
                <TranslatedText
                  stringId="general.localisedField.dietId.label"
                  fallback="Diet"
                  data-testid="translatedtext-fx3m"
                />
              }
              endpoint="diet"
              component={SuggesterSelectField}
              isMulti
              style={{ gridColumn: 'span 2' }}
              data-testid="localisedfield-fyl2"
            />
          )}
          <Field
            name="reasonForEncounter"
            label={
              <TranslatedText
                stringId="encounter.reasonForEncounter.label"
                fallback="Reason for encounter"
                data-testid="translatedtext-3pr0"
              />
            }
            component={TextField}
            multiline
            minRows={2}
            style={{ gridColumn: 'span 2' }}
            data-testid="field-o5gm"
          />
          <div style={{ gridColumn: 2, textAlign: 'right' }}>
            <FormSubmitButton
              variant="contained"
              onSubmit={submitForm}
              color="primary"
              data-testid="formsubmitbutton-4ker"
            >
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
              data-testid="translatedtext-8qsw"
            />,
          ),
          locationId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.localisedField.locationId.label"
              fallback="Location"
              data-testid="translatedtext-x17t"
            />,
          ),
          departmentId: foreignKey().translatedLabel(
            <TranslatedText
              stringId="general.department.label"
              fallback="Department"
              data-testid="translatedtext-uguh"
            />,
          ),
          startDate: yup
            .date()
            .required()
            .translatedLabel(
              isInpatient(encounterType) ? (
                <TranslatedText
                  stringId="patient.modal.checkIn.admissionDateTime.label"
                  fallback="Admission date & time"
                  data-testid="translatedtext-s4yn"
                />
              ) : (
                <TranslatedText
                  stringId="patient.modal.checkIn.checkInDateTime.label"
                  fallback="Check-in date & time"
                  data-testid="translatedtext-s4yn"
                />
              ),
            ),
          encounterType: yup
            .string()
            .oneOf(ENCOUNTER_OPTIONS.map(x => x.value))
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="patient.modal.checkIn.encounterType.label"
                fallback="Encounter type"
                data-testid="translatedtext-ypc3"
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
        data-testid="form-8uoi"
      />
    );
  },
);

EncounterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
