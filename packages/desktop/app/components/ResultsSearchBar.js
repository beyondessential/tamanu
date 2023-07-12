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

const StyledAutoCompleteInput = styled(AutocompleteInput)`
  .MuiInputBase-root.Mui-disabled {
    background: ${Colors.background};
  }

  .MuiOutlinedInput-root:hover.Mui-disabled .MuiOutlinedInput-notchedOutline {
    border-color: ${Colors.softOutline};
  }

  .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline {
    border-color: ${Colors.softOutline};
  }
`;

export const ResultsSearchBar = React.memo(
  ({ setSearchParameters, searchParameters, patientId, disabled }) => {
    const panelSuggester = useSuggester('patientLabPanelTypes', {
      baseQueryParameters: { patientId },
    });
    const categorySuggester = useSuggester('patientLabTestCategories', {
      baseQueryParameters: { patientId },
    });
    return (
      <Container>
        <Heading3 mb={2}>Lab results</Heading3>
        <Fields>
          <StyledAutoCompleteInput
            name="category"
            label="Test category"
            disabled={disabled}
            suggester={categorySuggester}
            value={searchParameters.categoryId}
            onChange={event => {
              const categoryId = event.target.value;
              setSearchParameters(categoryId ? { categoryId } : {});
            }}
          />
          <StyledAutoCompleteInput
            name="panel"
            label="Test panel"
            disabled={disabled}
            value={searchParameters.panelId}
            suggester={panelSuggester}
            onChange={event => {
              const panelId = event.target.value;
              setSearchParameters(panelId ? { panelId } : {});
            }}
          />
        </Fields>
      </Container>
    );
  },
);
