import React, { useState } from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { AutocompleteField, LocalisedField, SearchField } from '../Field';
import { useSuggester } from '../../api';
import { useLocalisedText } from '../LocalisedText';

export const PatientSearchBar = React.memo(
  ({ onSearch, searchParameters, suggestByFacility = true }) => {
    const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });
    const locationGroupSuggester = useSuggester('locationGroup', {
      baseQueryParameters: suggestByFacility ? { filterByFacility: true } : {},
    });
    const departmentSuggester = useSuggester('department', {
      baseQueryParameters: suggestByFacility ? { filterByFacility: true } : {},
    });

    const [showAdvancedFields, setShowAdvancedFields] = useState(false);
    const practitionerSuggester = useSuggester('practitioner');
    return (
      <CustomisableSearchBar
        showExpandButton
        title="Search for Patients"
        onSearch={onSearch}
        isExpanded={showAdvancedFields}
        setIsExpanded={setShowAdvancedFields}
        initialValues={searchParameters}
        staticValues={{ displayIdExact: true }}
        hiddenFields={
          <>
            <LocalisedField useShortLabel component={SearchField} name="displayId" keepLetterCase />
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
        <LocalisedField name="firstName" component={SearchField} />
        <LocalisedField name="lastName" component={SearchField} />
        <LocalisedField
          name="locationGroupId"
          defaultLabel="Location"
          component={AutocompleteField}
          size="small"
          suggester={locationGroupSuggester}
        />
        <LocalisedField
          name="departmentId"
          defaultLabel="Department"
          size="small"
          component={AutocompleteField}
          suggester={departmentSuggester}
        />
      </CustomisableSearchBar>
    );
  },
);
