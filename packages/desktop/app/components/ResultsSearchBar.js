import React from 'react';
import styled from 'styled-components';
import { useSuggester } from '../api';
import { AutocompleteInput } from './Field';
import { Colors } from '../constants';
import { Heading3 } from './Typography';

const Container = styled.div`
  padding: 24px 30px 30px;
  border-radius: 3px 3px 0 0;
  background-color: #ffffff;
  border-bottom: 1px solid ${Colors.outline};
`;

const Fields = styled.div`
  display: flex;
  align-items: center;

  > div {
    margin-right: 20px;
  }
`;

export const ResultsSearchBar = React.memo(
  ({ setSearchParameters, searchParameters, patientId }) => {
    const panelSuggester = useSuggester('patientLabTestPanelTypes', {
      baseQueryParameters: { patientId },
    });
    const categorySuggester = useSuggester('patientLabTestCategories', {
      baseQueryParameters: { patientId },
    });
    return (
      <Container>
        <Heading3 mb={2}>Lab results</Heading3>
        <Fields>
          <AutocompleteInput
            name="category"
            label="Test category"
            suggester={categorySuggester}
            value={searchParameters.categoryId}
            onChange={event => {
              setSearchParameters({ categoryId: event.target.value, panelId: '' });
            }}
          />
          <AutocompleteInput
            name="panel"
            label="Test panel"
            value={searchParameters.panelId}
            suggester={panelSuggester}
            onChange={event => {
              setSearchParameters({ categoryId: '', panelId: event.target.value });
            }}
          />
        </Fields>
      </Container>
    );
  },
);
