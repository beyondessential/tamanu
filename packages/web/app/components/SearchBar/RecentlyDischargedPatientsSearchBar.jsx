import React from 'react';
import { PATIENT_STATUS_LABELS } from '@tamanu/constants';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import { AutocompleteField, Field, SearchField, TranslatedSelectField } from '../Field';
import { useSuggester } from '../../api';
import { useAdvancedFields } from './useAdvancedFields';
import { TranslatedText } from '../Translation/TranslatedText';
import { useTranslation } from '../../contexts/Translation';

const ADVANCED_FIELDS = ['locationGroupId', 'departmentId', 'dischargingClinicianId'];

const RecentlyDischargedPatientsAdvancedFields = () => {
  const { getTranslation } = useTranslation();
  const areaSuggester = useSuggester('facilityLocationGroup');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  const practitionerSuggester = useSuggester('practitioner');

  return (
    <>
      <Field
        name="locationGroupId"
        label={
          <TranslatedText
            stringId="general.localisedField.locationGroupId.label"
            fallback="Area"
            data-testid="translatedtext-rdp-area"
          />
        }
        component={AutocompleteField}
        suggester={areaSuggester}
        size="small"
        data-testid="field-rdp-area"
      />
      <Field
        name="departmentId"
        label={
          <TranslatedText
            stringId="general.localisedField.departmentId.label"
            fallback="Department"
            data-testid="translatedtext-rdp-department"
          />
        }
        component={AutocompleteField}
        suggester={departmentSuggester}
        size="small"
        data-testid="field-rdp-department"
      />
      <Field
        name="dischargingClinicianId"
        label={
          <TranslatedText
            stringId="general.dischargingClinician.label"
            fallback="Discharging :clinician"
            replacements={{
              clinician: getTranslation(
                'general.localisedField.clinician.label.short',
                'Clinician',
                {
                  casing: 'lower',
                },
              ),
            }}
            data-testid="translatedtext-rdp-discharging-clinician"
          />
        }
        component={AutocompleteField}
        suggester={practitionerSuggester}
        size="small"
        data-testid="field-rdp-discharging-clinician"
      />
    </>
  );
};

// spec: RDISCH#search
export const RecentlyDischargedPatientsSearchBar = React.memo(({ onSearch, searchParameters }) => {
  const { showAdvancedFields, setShowAdvancedFields } = useAdvancedFields(
    ADVANCED_FIELDS,
    searchParameters,
  );

  return (
    <CustomisableSearchBarWithPermissionCheck
      verb="list"
      noun="Patient"
      showExpandButton
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      onSearch={onSearch}
      initialValues={searchParameters}
      hiddenFields={<RecentlyDischargedPatientsAdvancedFields />}
      data-testid="customisablesearchbarwithpermissioncheck-rdp"
    >
      <Field
        name="displayId"
        label={
          <TranslatedText
            stringId="general.patientId.label"
            fallback="Patient ID"
            data-testid="translatedtext-rdp-patient-id"
          />
        }
        component={SearchField}
        data-testid="field-rdp-patient-id"
      />
      <Field
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-testid="translatedtext-rdp-first-name"
          />
        }
        component={SearchField}
        data-testid="field-rdp-first-name"
      />
      <Field
        name="lastName"
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-testid="translatedtext-rdp-last-name"
          />
        }
        component={SearchField}
        data-testid="field-rdp-last-name"
      />
      <Field
        name="patientStatus"
        label={
          <TranslatedText
            stringId="encounter.encounterType.label"
            fallback="Encounter type"
            data-testid="translatedtext-rdp-encounter-type"
          />
        }
        component={TranslatedSelectField}
        enumValues={PATIENT_STATUS_LABELS}
        size="small"
        data-testid="field-rdp-encounter-type"
      />
    </CustomisableSearchBarWithPermissionCheck>
  );
});
