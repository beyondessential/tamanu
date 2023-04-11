import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Button, SvgIcon } from '@material-ui/core';
import { HandoverNotesPDF } from 'shared/utils/handoverNotes';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { AutocompleteField, LocalisedField, SelectField } from '../Field';
import { useSuggester } from '../../api';
import { Colors, locationAvailabilityOptions } from '../../constants';
import { useLocalisation } from '../../contexts/Localisation';
import { Modal } from '../index';

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

const HandoverIcon = ({ color }) => (
  <svg width="17" height="20" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.625 1.75H10.9675C10.6 0.735 9.6375 0 8.5 0C7.3625 0 6.4 0.735 6.0325 1.75H2.375C1.4125 1.75 0.625 2.5375 0.625 3.5V17.5C0.625 18.4625 1.4125 19.25 2.375 19.25H14.625C15.5875 19.25 16.375 18.4625 16.375 17.5V3.5C16.375 2.5375 15.5875 1.75 14.625 1.75ZM8.5 1.75C8.98125 1.75 9.375 2.14375 9.375 2.625C9.375 3.10625 8.98125 3.5 8.5 3.5C8.01875 3.5 7.625 3.10625 7.625 2.625C7.625 2.14375 8.01875 1.75 8.5 1.75ZM14.625 17.5H2.375V3.5H4.125V6.125H12.875V3.5H14.625V17.5Z" fill={color}/>
  </svg>
);

const EmptyGridItem = styled.div``;

export const BedManagementSearchBar = React.memo(({ onSearch, searchParameters }) => {

  const { getLocalisation } = useLocalisation();
  const locationGroupSuggester = useSuggester('locationGroup', {
    baseQueryParameters: { filterByFacility: true },
  });

  const [handoverNotesModalShown, setHandoverNotesModalShown] = useState(false);

  const handleHandoverNotesButtonClick = useCallback(() => setHandoverNotesModalShown(true), [setHandoverNotesModalShown]);

  const handleHandoverNotesModalClose = useCallback(() => setHandoverNotesModalShown(false), [setHandoverNotesModalShown]);

  return (
    <>
      <CustomisableSearchBar
        title="Search Locations"
        onSearch={onSearch}
        initialValues={searchParameters}
      >
        <HandoverNotesButton
          type="button"
          disabled={!searchParameters?.area}
          startIcon={<HandoverIcon color={searchParameters?.area ? Colors.primary : Colors.softText} />}
          onClick={handleHandoverNotesButtonClick}
        >
          Handover notes
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
      <Modal
        open={handoverNotesModalShown}
        onClose={handleHandoverNotesModalClose}
        printable
      >
        <HandoverNotesPDF
          area={searchParameters?.area}
          getLocalisation={getLocalisation}
        />
      </Modal>
    </>
  );
});
