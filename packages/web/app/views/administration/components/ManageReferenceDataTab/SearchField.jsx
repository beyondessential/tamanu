import React from 'react';
import { startCase } from 'lodash';
import styled from 'styled-components';
import { TextField, useTranslation } from '@tamanu/ui-components';
import {
  AutocompleteField,
  CheckField,
  Field,
  MultiAutocompleteField,
} from '../../../../components/Field';
import { NumberField } from '../../../../components/Field/NumberField';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { useSuggester } from '../../../../api/suggesters';
import { SUGGESTER_OPTIONS } from './constants';

const VISIBILITY_STATUS_KEY = 'visibilityStatus';
const AVAILABLE_FACILITIES_KEY = 'availableFacilities';
const NUMERIC_TYPES = ['INTEGER', 'FLOAT', 'DOUBLE', 'DECIMAL', 'REAL'];

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
      label={startCase('availableFacilities')}
      component={MultiAutocompleteField}
      suggester={suggester}
      data-testid="searchfield-availableFacilities"
    />
  );
};

const SuggesterSearchField = ({ col }) => {
  const suggester = useSuggester(col.suggesterEndpoint, SUGGESTER_OPTIONS);
  return (
    <Field
      name={col.key}
      label={startCase(col.key)}
      component={AutocompleteField}
      suggester={suggester}
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
  if (col.suggesterEndpoint) {
    return <SuggesterSearchField col={col} />;
  }
  if (col.type === 'BOOLEAN') {
    return (
      <CentredCheckContainer>
        <Field
          component={CheckField}
          name={col.key}
          label={startCase(col.key)}
          data-testid={`searchfield-${col.key}`}
        />
      </CentredCheckContainer>
    );
  }
  const isNumeric = NUMERIC_TYPES.includes(col.type);
  return (
    <Field
      component={isNumeric ? NumberField : TextField}
      name={col.key}
      label={startCase(col.key)}
      placeholder={getTranslation('general.placeholder.search...', 'Search…')}
      data-testid={`searchfield-${col.key}`}
    />
  );
};
