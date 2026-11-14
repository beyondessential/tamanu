import React from 'react';
import styled from 'styled-components';
import { useSuggester } from '../../api';
import { AutocompleteField, LocalisedField, TranslatedSelectField } from '../Field';
import { HandoverNotesButton } from '../BedManagement/HandoverNotesButton';
import { DietSummaryButton } from '../BedManagement/DietSummaryButton';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { TranslatedText } from '../Translation/TranslatedText';
import { LOCATION_AVAILABILITY_STATUS_LABELS } from '@tamanu/constants';
import { useTranslation } from '../../contexts/Translation';

const PrintActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: auto;
`;

const EmptyGridItem = styled.div``;

export const BedManagementSearchBar = React.memo(({ onSearch, searchParameters }) => {
  const { getTranslation } = useTranslation();
  const locationGroupSuggester = useSuggester('locationGroup', {
    baseQueryParameters: { filterByFacility: true },
  });

  return (
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
      <PrintActions data-testid="printactions-bedmanagement">
        <HandoverNotesButton area={searchParameters?.area} />
        <DietSummaryButton area={searchParameters?.area} />
      </PrintActions>

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
  );
});
