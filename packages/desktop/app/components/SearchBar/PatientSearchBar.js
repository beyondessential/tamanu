import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { AutocompleteField, LocalisedField, SearchField } from '../Field';
import { useSuggester } from '../../api';
import { useLocalisedText } from '../LocalisedText';
import { useAdvancedFields } from './useAdvancedFields';

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
              defaultLabel="Department"
              size="small"
              component={AutocompleteField}
              suggester={departmentSuggester}
            />
            <LocalisedField
              name="clinicianId"
              defaultLabel={clinicianText}
              component={AutocompleteField}
              size="small"
              suggester={practitionerSuggester}
            />
          </>
        }
      >
        <LocalisedField useShortLabel component={SearchField} name="displayId" keepLetterCase />
        <LocalisedField name="firstName" component={SearchField} />
        <LocalisedField name="lastName" component={SearchField} />
        <LocalisedField
          name="locationGroupId"
          defaultLabel="Location"
          component={AutocompleteField}
          size="small"
          suggester={locationGroupSuggester}
        />
      </CustomisableSearchBar>
    );
  },
);
