import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { AutocompleteField, LocalisedField, SearchField } from '../Field';
import { useSuggester } from '../../api';
import { useLocalisedText } from '../LocalisedText';
import { useAdvancedFields } from './useAdvancedFields';
import { TranslatedText } from '../Translation/TranslatedText';

const ADVANCED_FIELDS = ['departmentId', 'clinicianId'];

export const PatientSearchBar = React.memo(
  ({ onSearch, searchParameters, suggestByFacility = true }) => {
    const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });
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
    return (
      <CustomisableSearchBar
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
                />
              }
              size="small"
              component={AutocompleteField}
              suggester={departmentSuggester}
            />
            <LocalisedField
              name="clinicianId"
              label={
                <TranslatedText
                  stringId="general.localisedField.clinicianId.label"
                  fallback="Clinician"
                />
              }
              defaultLabel={clinicianText}
              component={AutocompleteField}
              size="small"
              suggester={practitionerSuggester}
            />
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
            />
          }
          keepLetterCase
        />
        <LocalisedField
          name="firstName"
          label={
            <TranslatedText
              stringId="general.localisedField.firstName.label"
              fallback="First name"
            />
          }
          component={SearchField}
        />
        <LocalisedField
          name="lastName"
          label={
            <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
          }
          component={SearchField}
        />
        <LocalisedField
          name="locationGroupId"
          label={
            <TranslatedText
              stringId="general.localisedField.locationGroupId.label"
              fallback="Area"
            />
          }
          component={AutocompleteField}
          size="small"
          suggester={locationGroupSuggester}
        />
      </CustomisableSearchBar>
    );
  },
);
