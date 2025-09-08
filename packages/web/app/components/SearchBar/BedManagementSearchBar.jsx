import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import { useSuggester } from '../../api';
import { Colors } from '../../constants';
import { HandoverNotesIcon } from '../../assets/icons/HandoverNotesIcon';
import { AutocompleteField, LocalisedField } from '../Field';
import { TranslatedSelectField } from '@tamanu/ui-components';
import { HandoverNotesModal } from '../BedManagement/HandoverNotesModal';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { ThemedTooltip } from '../Tooltip';
import { TranslatedText } from '../Translation/TranslatedText';
import { LOCATION_AVAILABILITY_STATUS_LABELS } from '@tamanu/constants';
import { useTranslation } from '../../contexts/Translation';

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
  &.Mui-disabled {
    pointer-events: auto;
  }
`;

const EmptyGridItem = styled.div``;

export const BedManagementSearchBar = React.memo(({ onSearch, searchParameters }) => {
  const { getTranslation } = useTranslation();
  const locationGroupSuggester = useSuggester('locationGroup', {
    baseQueryParameters: { filterByFacility: true },
  });

  const [handoverNotesModalShown, setHandoverNotesModalShown] = useState(false);

  const handleHandoverNotesButtonClick = useCallback(
    () => setHandoverNotesModalShown(true),
    [setHandoverNotesModalShown],
  );

  const handleHandoverNotesModalClose = useCallback(
    () => setHandoverNotesModalShown(false),
    [setHandoverNotesModalShown],
  );

  const handoverNotesButtonDisabled = !searchParameters?.area;

  return (
    <>
      <CustomisableSearchBar
        title={
          <TranslatedText
            stringId="bedManagement.search.title"
            fallback="Search Locations"
            data-testid="translatedtext-zn2t"
          />
        }
        onSearch={onSearch}
        initialValues={searchParameters}
        data-testid="customisablesearchbar-xodq"
      >
        <HandoverNotesButton
          disabled={handoverNotesButtonDisabled}
          startIcon={
            <HandoverNotesIcon
              color={searchParameters?.area ? Colors.primary : Colors.softText}
              data-testid="handovernotesicon-d4ts"
            />
          }
          onClick={handleHandoverNotesButtonClick}
          data-testid="handovernotesbutton-40su"
        >
          {handoverNotesButtonDisabled ? (
            <ThemedTooltip
              title={
                <TranslatedText
                  stringId="bedManagement.search.handoverNotes.tooltip"
                  fallback="Select an 'Area' to create handover notes"
                  data-testid="translatedtext-g7x4"
                />
              }
              data-testid="themedtooltip-25rl"
            >
              <span>
                <TranslatedText
                  stringId="bedManagement.search.handoverNotes.button.label"
                  fallback="Handover notes"
                  data-testid="translatedtext-7sg3"
                />
              </span>
            </ThemedTooltip>
          ) : (
            <TranslatedText
              stringId="bedManagement.search.handoverNotes.button.label"
              fallback="Handover notes"
              data-testid="translatedtext-94wp"
            />
          )}
        </HandoverNotesButton>

        <EmptyGridItem data-testid="emptygriditem-t5fd" />
        <LocalisedField
          name="area"
          label={
            <TranslatedText
              stringId="general.localisedField.area.label"
              fallback="Area"
              data-testid="translatedtext-9195"
            />
          }
          component={AutocompleteField}
          size="small"
          suggester={locationGroupSuggester}
          data-testid="localisedfield-rcg5"
        />
        <LocalisedField
          name="status"
          label={
            <TranslatedText
              stringId="general.localisedField.status.label"
              fallback="Status"
              data-testid="translatedtext-dm7m"
            />
          }
          size="small"
          component={TranslatedSelectField}
          transformOptions={(options) => [
            { value: '', label: getTranslation('general.select.all', 'All') },
            ...options,
          ]}
          enumValues={LOCATION_AVAILABILITY_STATUS_LABELS}
          data-testid="localisedfield-vkhx"
        />
      </CustomisableSearchBar>
      <HandoverNotesModal
        open={handoverNotesModalShown}
        onClose={handleHandoverNotesModalClose}
        printable
        width="md"
        keepMounted
        area={searchParameters?.area}
        data-testid="handovernotesmodal-el85"
      />
    </>
  );
});
