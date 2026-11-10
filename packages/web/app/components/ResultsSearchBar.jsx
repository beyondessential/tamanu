import React, { useMemo } from 'react';
import styled from 'styled-components';
import { toArrayParam } from '@tamanu/utils/toArrayParam';
import { useSuggester } from '../api';
import { AutocompleteInput, MultiAutocompleteInput } from './Field';
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
  align-items: flex-start;

  > div {
    margin-right: 20px;
  }
`;

const StyledAutoCompleteInput = styled(AutocompleteInput)`
  width: 250px;

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

// The shared multi-select renders its count tag ("5 selected") in small text; this field shows it
// at the field's normal text size, matching the rest of the search bar.
const TestOrPanelField = styled.div`
  width: 300px;

  .react-select__multi-value__label {
    font-size: 14px;
    line-height: 18px;
  }
`;

const PANEL_PREFIX = 'panel:';
const TEST_PREFIX = 'test:';

export const ResultsSearchBar = React.memo(
  ({ setSearchParameters, searchParameters, patientId, disabled }) => {
    // Stable options keep each useSuggester (and the merged suggester below) identity stable across
    // renders, so MultiAutocompleteInput's debounce timer survives between keystrokes. The category
    // list is unscoped; the test/panel suggesters are scoped to the picked category so they only
    // suggest that category's tests and panels (they re-create when the category changes).
    const categoryOptions = useMemo(() => ({ baseQueryParameters: { patientId } }), [patientId]);
    const scopedOptions = useMemo(
      () => ({
        baseQueryParameters: { patientId, categoryId: searchParameters.categoryId || undefined },
      }),
      [patientId, searchParameters.categoryId],
    );
    const categorySuggester = useSuggester('patientLabTestCategories', categoryOptions);
    const panelSuggester = useSuggester('patientLabTestPanelTypes', scopedOptions);
    const testSuggester = useSuggester('patientLabTestTypes', scopedOptions);

    // One field suggests both tests and panels, listed together by name. Each option is tagged with
    // its kind in the value (panel:<id> / test:<id>) so the two can be told apart when filtering.
    const testOrPanelSuggester = useMemo(() => {
      const tag = (prefix, options) =>
        options.map(option => ({ ...option, value: `${prefix}${option.value}` }));
      return {
        fetchSuggestions: async search => {
          const [panels, tests] = await Promise.all([
            panelSuggester.fetchSuggestions(search),
            testSuggester.fetchSuggestions(search),
          ]);
          return [...tag(PANEL_PREFIX, panels), ...tag(TEST_PREFIX, tests)].sort((a, b) =>
            a.label.localeCompare(b.label),
          );
        },
        fetchCurrentOption: async compositeValue => {
          const isPanel = compositeValue.startsWith(PANEL_PREFIX);
          const prefix = isPanel ? PANEL_PREFIX : TEST_PREFIX;
          const suggester = isPanel ? panelSuggester : testSuggester;
          const option = await suggester.fetchCurrentOption(compositeValue.slice(prefix.length));
          // Keep a resolvable option even when the id no longer resolves (a deleted/unavailable test
          // or panel, or a 404 from the lookup route) so the chip still renders instead of throwing
          // on option.label.
          return option
            ? { ...option, value: `${prefix}${option.value}` }
            : { value: compositeValue, label: '' };
        },
      };
    }, [panelSuggester, testSuggester]);

    const selectedTestOrPanel = useMemo(
      () => [
        ...toArrayParam(searchParameters.panelIds).map(id => `${PANEL_PREFIX}${id}`),
        ...toArrayParam(searchParameters.testIds).map(id => `${TEST_PREFIX}${id}`),
      ],
      [searchParameters.panelIds, searchParameters.testIds],
    );

    const handleTestOrPanelChange = event => {
      const value = event.target.value ?? [];
      const { categoryId } = searchParameters;
      if (!value.length) {
        // Clearing the picks keeps the category in place (shows the category-only view).
        setSearchParameters(categoryId ? { categoryId } : {});
        return;
      }
      const panelIds = value
        .filter(id => id.startsWith(PANEL_PREFIX))
        .map(id => id.slice(PANEL_PREFIX.length));
      const testIds = value
        .filter(id => id.startsWith(TEST_PREFIX))
        .map(id => id.slice(TEST_PREFIX.length));
      // Picking a test or panel leaves the category in place; it scopes what can be picked.
      setSearchParameters(categoryId ? { categoryId, panelIds, testIds } : { panelIds, testIds });
    };

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
            onChange={event => {
              const categoryId = event.target.value;
              if (categoryId) {
                // Changing the category clears any picked tests and panels.
                setSearchParameters({ categoryId });
                return;
              }
              // Clearing the category keeps the picks; '' resets the field's displayed value.
              const panelIds = toArrayParam(searchParameters.panelIds);
              const testIds = toArrayParam(searchParameters.testIds);
              setSearchParameters(
                panelIds.length || testIds.length ? { categoryId: '', panelIds, testIds } : {},
              );
            }}
            data-testid="styledautocompleteinput-ar0l"
          />
          <TestOrPanelField data-testid="testorpanelfield-mu8z">
            <MultiAutocompleteInput
              name="testOrPanel"
              label={
                <TranslatedText
                  stringId="patient.lab.results.search.testOrPanel.label"
                  fallback="Test or panel"
                  data-testid="translatedtext-py06"
                />
              }
              disabled={disabled}
              suggester={testOrPanelSuggester}
              value={selectedTestOrPanel}
              onChange={handleTestOrPanelChange}
              maxSelected={Infinity}
            />
          </TestOrPanelField>
        </Fields>
      </Container>
    );
  },
);
