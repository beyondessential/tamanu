import React from 'react';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import { AutocompleteField, LocalisedField, SearchField } from '../Field';
import { useSuggester } from '../../api';
import { useAdvancedFields } from './useAdvancedFields';
import { TranslatedText } from '../Translation/TranslatedText';

const ADVANCED_FIELDS = ['departmentId', 'clinicianId', 'dietId'];

export const PatientSearchBar = React.memo(
  ({ onSearch, searchParameters, suggestByFacility = true, isInpatient = false }) => {
    const locationGroupSuggester = useSuggester('locationGroup', {
      baseQueryParameters: suggestByFacility ? { filterByFacility: true } : {},
    });
    const departmentSuggester = useSuggester('department', {
      baseQueryParameters: suggestByFacility ? { filterByFacility: true } : {},
    });

    const { showAdvancedFields, setShowAdvancedFields } = useAdvancedFields(
      ADVANCED_FIELDS,
      searchParameters,
    );

    const practitionerSuggester = useSuggester('practitioner');
    const dietSuggester = useSuggester('diet');
    return (
      <CustomisableSearchBarWithPermissionCheck
        verb="list"
        noun="Patient"
        showExpandButton
        title="Search for Patients"
        onSearch={onSearch}
        isExpanded={showAdvancedFields}
        setIsExpanded={setShowAdvancedFields}
        initialValues={searchParameters}
        hiddenFields={
          <>
            <LocalisedField
              name="departmentId"
              label={
                <TranslatedText
                  stringId="general.localisedField.departmentId.label"
                  fallback="Department"
                  data-test-id='translatedtext-4n8p' />
              }
              size="small"
              component={AutocompleteField}
              suggester={departmentSuggester}
              data-test-id='localisedfield-qnaf' />
            <LocalisedField
              name="clinicianId"
              label={
                <TranslatedText
                  stringId="general.localisedField.clinicianId.label"
                  fallback="Clinician"
                  data-test-id='translatedtext-kk7m' />
              }
              component={AutocompleteField}
              size="small"
              suggester={practitionerSuggester}
              data-test-id='localisedfield-xku1' />
            {isInpatient && (
              <LocalisedField
                name="dietId"
                size="small"
                label={
                  <TranslatedText
                    stringId="general.localisedField.dietId.label"
                    fallback="Diet"
                    data-test-id='translatedtext-v1pk' />
                }
                suggester={dietSuggester}
                component={AutocompleteField}
                data-test-id='localisedfield-85ap' />
            )}
          </>
        }
      >
        <LocalisedField
          component={SearchField}
          name="displayId"
          label={
            <TranslatedText
              stringId="general.localisedField.displayId.label.short"
              fallback="NHN"
              data-test-id='translatedtext-dhy2' />
          }
          data-test-id='localisedfield-vv9v' />
        <LocalisedField
          name="firstName"
          label={
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
              data-test-id='translatedtext-j1zn' />
          }
          component={SearchField}
          data-test-id='localisedfield-4gfj' />
        <LocalisedField
          name="lastName"
          label={
            <TranslatedText
              stringId="general.localisedField.lastName.label"
              fallback="Last name"
              data-test-id='translatedtext-fnpx' />
          }
          component={SearchField}
          data-test-id='localisedfield-0rfo' />
        <LocalisedField
          name="locationGroupId"
          label={
            <TranslatedText
              stringId="general.localisedField.locationGroupId.label"
              fallback="Area"
              data-test-id='translatedtext-p6qd' />
          }
          component={AutocompleteField}
          size="small"
          suggester={locationGroupSuggester}
          data-test-id='localisedfield-luhn' />
      </CustomisableSearchBarWithPermissionCheck>
    );
  },
);
