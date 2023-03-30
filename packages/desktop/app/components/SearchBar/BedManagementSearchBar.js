import React from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { AutocompleteField, LocalisedField, SelectField } from '../Field';
import { useSuggester } from '../../api';
import { useLocationAvailabilityOptions } from '../../hooks';
import handoverNotes from '../../assets/images/handover_notes.svg';
import { Colors } from '../../constants';

const HandoverNotesButton = styled(Button)`
  font-weight: 500;
  text-transform: none;
  text-decoration: underline;
  color: ${Colors.primary};
  margin-right: auto;
  margin-top: auto;
  margin-bottom: auto;
  &:hover {
    text-decoration: underline;
  }
`;

const HandoverNotesIcon = styled.img`
  margin-right: 5px;
`;

export const BedManagementSearchBar = React.memo(({ onSearch, searchParameters }) => {
  const locationAvailabilityOptions = useLocationAvailabilityOptions();
  const locationGroupSuggester = useSuggester('locationGroup', {
    baseQueryParameters: { filterByFacility: true },
  });

  return (
    <CustomisableSearchBar
      title="Search Locations"
      onSearch={onSearch}
      initialValues={searchParameters}
    >
      <HandoverNotesButton type="button">
        <HandoverNotesIcon src={handoverNotes} />
        Handover notes
      </HandoverNotesButton>
      <div />
      <LocalisedField
        name="area"
        defaultLabel="Area"
        component={AutocompleteField}
        size="small"
        suggester={locationGroupSuggester}
      />
      <LocalisedField
        name="status"
        defaultLabel="Status"
        size="small"
        component={SelectField}
        options={locationAvailabilityOptions}
      />
    </CustomisableSearchBar>
  );
});
