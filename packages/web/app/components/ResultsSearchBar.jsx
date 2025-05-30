import React from 'react';
import styled from 'styled-components';
import { useSuggester } from '../api';
import { AutocompleteInput } from './Field';
import { Colors } from '../constants';
import { Heading3 } from './Typography';
import { TranslatedText } from './Translation/TranslatedText';

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
    const panelSuggester = useSuggester('patientLabTestPanelTypes', {
      baseQueryParameters: { patientId },
    });
    const categorySuggester = useSuggester('patientLabTestCategories', {
      baseQueryParameters: { patientId },
    });
    return (
      <Container data-testid="container-j780">
        <Heading3 mb={2} data-testid="heading3-b7on">
          <TranslatedText
            stringId="patient.lab.results.search.title"
            fallback="Lab results"
            data-testid="translatedtext-iv76"
          />
        </Heading3>
        <Fields data-testid="fields-z2wd">
          <StyledAutoCompleteInput
            name="category"
            label={
              <TranslatedText
                stringId="lab.testCategory.label"
                fallback="Test category"
                data-testid="translatedtext-5opn"
              />
            }
            disabled={disabled}
            suggester={categorySuggester}
            value={searchParameters.categoryId}
            onChange={(event) => {
              const categoryId = event.target.value;
              setSearchParameters(categoryId ? { categoryId } : {});
            }}
            data-testid="styledautocompleteinput-ar0l"
          />
          <StyledAutoCompleteInput
            name="panel"
            label={
              <TranslatedText
                stringId="patient.lab.results.search.panel.label"
                fallback="Test panel"
                data-testid="translatedtext-py06"
              />
            }
            disabled={disabled}
            value={searchParameters.panelId}
            suggester={panelSuggester}
            onChange={(event) => {
              const panelId = event.target.value;
              setSearchParameters(panelId ? { panelId } : {});
            }}
            data-testid="styledautocompleteinput-mu8z"
          />
        </Fields>
      </Container>
    );
  },
);
