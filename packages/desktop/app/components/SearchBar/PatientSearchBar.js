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
                  stringId="general.localisedFields.departmentId.label"
                  fallback="TODO"
                />
              }
              defaultLabel="Department"
              size="small"
              component={AutocompleteField}
              suggester={departmentSuggester}
            />
            <LocalisedField
              name="clinicianId"
              label={
                <TranslatedText
                  stringId="general.localisedFields.clinicianId.label"
                  fallback="TODO"
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
          useShortLabel
          component={SearchField}
          name="displayId"
          label={
            <TranslatedText
              stringId="general.localisedFields.displayId.label.short"
              fallback="NHN"
            />
          }
          keepLetterCase
        />
        <LocalisedField
          name="firstName"
          label={
            <TranslatedText
              stringId="general.localisedFields.firstName.label"
              fallback="First name"
            />
          }
          component={SearchField}
        />
        <LocalisedField
          name="lastName"
          label={
            <TranslatedText
              stringId="general.localisedFields.lastName.label"
              fallback="Last name"
            />
          }
          component={SearchField}
        />
        <LocalisedField
          name="locationGroupId"
          label={
            <TranslatedText
              stringId="general.localisedFields.locationGroupId.label"
              fallback="TODO"
            />
          }
          defaultLabel="Location"
          component={AutocompleteField}
          size="small"
          suggester={locationGroupSuggester}
        />
      </CustomisableSearchBar>
    );
  },
);
