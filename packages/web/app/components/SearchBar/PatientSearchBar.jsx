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
                  data-testid='translatedtext-6so6' />
              }
              size="small"
              component={AutocompleteField}
              suggester={departmentSuggester}
              data-testid='localisedfield-50wl' />
            <LocalisedField
              name="clinicianId"
              label={
                <TranslatedText
                  stringId="general.localisedField.clinicianId.label"
                  fallback="Clinician"
                  data-testid='translatedtext-vm2u' />
              }
              component={AutocompleteField}
              size="small"
              suggester={practitionerSuggester}
              data-testid='localisedfield-8w55' />
            {isInpatient && (
              <LocalisedField
                name="dietId"
                size="small"
                label={
                  <TranslatedText
                    stringId="general.localisedField.dietId.label"
                    fallback="Diet"
                    data-testid='translatedtext-72qh' />
                }
                suggester={dietSuggester}
                component={AutocompleteField}
                data-testid='localisedfield-gzn5' />
            )}
          </>
        }
        data-testid='customisablesearchbarwithpermissioncheck-eqrd'>
        <LocalisedField
          component={SearchField}
          name="displayId"
          label={
            <TranslatedText
              stringId="general.localisedField.displayId.label.short"
              fallback="NHN"
              data-testid='translatedtext-x6u4' />
          }
          data-testid='localisedfield-4cb5' />
        <LocalisedField
          name="firstName"
          label={
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
              data-testid='translatedtext-oah7' />
          }
          component={SearchField}
          data-testid='localisedfield-0m33' />
        <LocalisedField
          name="lastName"
          label={
            <TranslatedText
              stringId="general.localisedField.lastName.label"
              fallback="Last name"
              data-testid='translatedtext-qjdt' />
          }
          component={SearchField}
          data-testid='localisedfield-26d7' />
        <LocalisedField
          name="locationGroupId"
          label={
            <TranslatedText
              stringId="general.localisedField.locationGroupId.label"
              fallback="Area"
              data-testid='translatedtext-v70s' />
          }
          component={AutocompleteField}
          size="small"
          suggester={locationGroupSuggester}
          data-testid='localisedfield-p72m' />
      </CustomisableSearchBarWithPermissionCheck>
    );
  },
);
