import React, { useState } from 'react';
import styled from 'styled-components';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { AutocompleteField, LocalisedField, DisplayIdField, SearchField } from '../Field';
import { useSuggester } from '../../api';
import { SearchBarCheckField } from './SearchBarCheckField';

const StyledCheckField = styled(SearchBarCheckField)`
  grid-column: 5;
`;
export const PatientSearchBar = React.memo(
  ({ onSearch, searchParameters, suggestByFacility = true }) => {
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
        initialValues={{ displayIdExact: true, ...searchParameters }}
        hiddenFields={
          <>
            <DisplayIdField />
            <LocalisedField
              name="clinicianId"
              defaultLabel="Clinician"
              component={AutocompleteField}
              size="small"
              suggester={practitionerSuggester}
            />
            <StyledCheckField name="deceased" label="Include deceased patients" />
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
