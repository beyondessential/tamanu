import React, { useMemo } from 'react';

import styled from 'styled-components';
import { useTranslation } from '@tamanu/ui-components';
import {
  AutocompleteField,
  CheckField,
  Field,
  MultiAutocompleteField,
  SearchField as SearchTextField,
  SelectField,
} from '../../../../components/Field';
import { NumberField } from '../../../../components/Field/NumberField';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { useSuggester } from '../../../../api/suggesters';
import { ID_SEARCH_SUGGESTER_OPTIONS, SUGGESTER_OPTIONS } from './constants';

const VISIBILITY_STATUS_KEY = 'visibilityStatus';
const AVAILABLE_FACILITIES_KEY = 'availableFacilities';
const NUMERIC_TYPES = ['INTEGER', 'FLOAT', 'DOUBLE', 'DECIMAL', 'REAL'];
// string values so an explicit "No" survives the search bar's empty-value filtering
// ('false' is truthy as a string); Postgres casts them back to booleans on the exact match
const BOOLEAN_SEARCH_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const CentredCheckContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  padding-top: 20px;
`;

const AvailableFacilitiesSearchField = () => {
  const suggester = useSuggester('facility', { ...SUGGESTER_OPTIONS, baseQueryParameters: { noLimit: true } });
  return (
    <Field
      name="availableFacilities"
      label="availableFacilities"
      component={MultiAutocompleteField}
      suggester={suggester}
      data-testid="searchfield-availableFacilities"
    />
  );
};

const SuggesterSearchField = ({ col }) => {
  const suggester = useSuggester(col.suggesterEndpoint, ID_SEARCH_SUGGESTER_OPTIONS);
  return (
    <Field
      name={col.key}
      label={col.key}
      component={AutocompleteField}
      suggester={suggester}
      data-testid={`searchfield-${col.key}`}
    />
  );
};

// Companion name column for an FK: a name-mode autocomplete over the same suggester.
// The submitted value is the record's name (not id), matching the server's name filter.
const NameSuggesterSearchField = ({ col }) => {
  const suggester = useSuggester(col.suggesterEndpoint, {
    formatter: ({ name }) => ({ label: name, value: name }),
  });
  // The field's value IS the name, so resolve "current option" locally — the autocomplete's
  // default behaviour is a by-id lookup, which 404s when handed a name
  const nameModeSuggester = useMemo(
    () => ({
      fetchSuggestions: search => suggester.fetchSuggestions(search),
      fetchCurrentOption: async value => ({ label: value, value }),
    }),
    [suggester],
  );
  return (
    <Field
      name={col.key}
      label={col.key}
      component={AutocompleteField}
      suggester={nameModeSuggester}
      data-testid={`searchfield-${col.key}`}
    />
  );
};

export const SearchField = ({ col }) => {
  const { getTranslation } = useTranslation();

  if (col.key === VISIBILITY_STATUS_KEY) {
    return (
      <CentredCheckContainer>
        <Field
          component={CheckField}
          name="visibilityStatus"
          label={
            <TranslatedText
              stringId="admin.referenceData.includeHistorical"
              fallback="Include historical"
              data-testid="translatedtext-include-historical"
            />
          }
          data-testid="searchfield-includeHistorical"
        />
      </CentredCheckContainer>
    );
  }
  if (col.key === AVAILABLE_FACILITIES_KEY) {
    return <AvailableFacilitiesSearchField />;
  }
  if (col.enumValues) {
    const options = col.enumValues.map(value => ({ value, label: value }));
    return (
      <Field
        component={SelectField}
        name={col.key}
        label={col.key}
        options={options}
        size="small"
        data-testid={`searchfield-${col.key}`}
      />
    );
  }
  if (col.isFkName) {
    return <NameSuggesterSearchField col={col} />;
  }
  if (col.suggesterEndpoint) {
    return <SuggesterSearchField col={col} />;
  }
  if (col.type === 'BOOLEAN') {
    // a Yes/No dropdown over a bare checkbox: the raw column-name label isn't sentence
    // English so a checkbox is hard to read, and a cleared dropdown (no filter) is
    // distinct from an explicit "No"
    return (
      <Field
        component={SelectField}
        name={col.key}
        label={col.key}
        options={BOOLEAN_SEARCH_OPTIONS}
        size="small"
        data-testid={`searchfield-${col.key}`}
      />
    );
  }
  const isNumeric = NUMERIC_TYPES.includes(col.type);
  return (
    <Field
      component={isNumeric ? NumberField : SearchTextField}
      name={col.key}
      label={col.key}
      // a "Search…" hint reads oddly on numeric fields (e.g. price), so leave those empty
      placeholder={isNumeric ? undefined : getTranslation('general.placeholder.search...', 'Search…')}
      data-testid={`searchfield-${col.key}`}
    />
  );
};
