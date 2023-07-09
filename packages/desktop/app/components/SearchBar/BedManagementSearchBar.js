import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import { useSuggester } from '../../api';
import { Colors, locationAvailabilityOptions } from '../../constants';
import { HandoverNotesIcon } from '../../assets/icons/HandoverNotesIcon';
import { AutocompleteField, LocalisedField, SelectField } from '../Field';
import { HandoverNotesModal } from '../BedManagement/HandoverNotesModal';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { ThemedTooltip } from '../Tooltip';

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

const EmptyGridItem = styled.div``;

export const BedManagementSearchBar = React.memo(({ onSearch, searchParameters }) => {
  const locationGroupSuggester = useSuggester('locationGroup', {
    baseQueryParameters: { filterByFacility: true },
  });

  const [handoverNotesModalShown, setHandoverNotesModalShown] = useState(false);

  const handleHandoverNotesButtonClick = useCallback(() => setHandoverNotesModalShown(true), [
    setHandoverNotesModalShown,
  ]);

  const handleHandoverNotesModalClose = useCallback(() => setHandoverNotesModalShown(false), [
    setHandoverNotesModalShown,
  ]);

  const handoverNotesButtonDisabled = Boolean(!searchParameters?.area);
  return (
    <>
      <CustomisableSearchBar
        title="Search Locations"
        onSearch={onSearch}
        initialValues={searchParameters}
      >
        <HandoverNotesButton
          disabled={handoverNotesButtonDisabled}
          startIcon={
            <HandoverNotesIcon color={searchParameters?.area ? Colors.primary : Colors.softText} />
          }
          onClick={handleHandoverNotesButtonClick}
        >
          {handoverNotesButtonDisabled ? (
            <ThemedTooltip title="Select an 'Area' to create handover notes">
              <span>Handover notes</span>
            </ThemedTooltip>
          ) : (
            'Handover notes'
          )}
        </HandoverNotesButton>

        <EmptyGridItem />
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
      <HandoverNotesModal
        open={handoverNotesModalShown}
        onClose={handleHandoverNotesModalClose}
        printable
        width="md"
        keepMounted
        area={searchParameters?.area}
      />
    </>
  );
});
