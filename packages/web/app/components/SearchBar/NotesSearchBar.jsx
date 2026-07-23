import React, { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useFormikContext } from 'formik';
import { debounce } from 'es-toolkit/compat';
import { IconButton } from '@material-ui/core';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import { NOTE_TYPES } from '@tamanu/constants';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, TextButton } from '@tamanu/ui-components';

import { AutocompleteField, DateField, Field, SearchField } from '../Field';
import { useAdvancedFields } from './useAdvancedFields';
import { useSuggester } from '../../api';
import { TranslatedText } from '../Translation/TranslatedText';
import { ThemedTooltip } from '../Tooltip';
import { useTranslation } from '../../contexts/Translation';
import { Colors } from '../../constants';

// Date filters live in the advanced search drawer.
const ADVANCED_FIELDS = ['fromDate', 'toDate'];

// Only the free text search is debounced; every other filter applies immediately.
const DEBOUNCED_FIELDS = ['search'];

// Kept at module scope so its identity is stable: useSuggester memoises on the
// options object, so passing a fresh one each render would rebuild the suggester
// and make the autocomplete refetch on every render.
const NOTE_TYPE_SUGGESTER_OPTIONS = {
  filterer: ({ id }) => id !== NOTE_TYPES.CLINICAL_MOBILE,
};

const Container = styled.div`
  padding: 12px 20px;
  border-bottom: 1px solid ${Colors.outline};
  font-size: 11px;
  // Keep the actions reachable by scrolling horizontally when space is tight
  // (eg with the console drawer open) rather than clipping them off screen.
  overflow-x: auto;

  // Labels and input placeholders/values for the search filters render at 14px.
  .MuiInputBase-input,
  .MuiFormControlLabel-label,
  .label-field {
    font-size: 14px;
  }
`;

// The field rows sit in their own column with the actions beside them, so both
// rows share the exact same width and the date fields line up with (and match the
// size of) the fields above them.
const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const FieldsArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FieldsRow = styled.div`
  display: flex;
  gap: 12px;
`;

// All fields (main and advanced) share the same sizing so the date fields match
// the fields above them: they grow with available space up to a cap, and never
// shrink below a usable width (the row scrolls horizontally when space is tight).
const FieldContainer = styled.div`
  flex: 1;
  min-width: 180px;
  max-width: 240px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  // Align with the input row (below the field labels), and never shrink or wrap
  // the action buttons; the row scrolls instead.
  margin-top: 20px;
  flex-shrink: 0;
`;

const ExpandIcon = styled(KeyboardDoubleArrowDownIcon)`
  &.MuiSvgIcon-root {
    font-size: 24px;
    transition: ${props => props.theme.transitions.create('rotate')};
  }
  [aria-expanded='true'] & {
    rotate: x 0.5turn;
  }
`;

const ClearButton = styled(TextButton)`
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
`;

// Watches the form values and pushes them up as the filters change, so no explicit
// search button is needed. Debounces changes to the free text search only, while
// applying selects and dates immediately.
const NotesSearchAutoSubmit = ({ onSearch }) => {
  const { values } = useFormikContext();
  const previousValuesRef = useRef(values);
  const debouncedSearch = useMemo(() => debounce(searchValues => onSearch(searchValues), 300), [
    onSearch,
  ]);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  useEffect(() => {
    const previousValues = previousValuesRef.current;
    previousValuesRef.current = values;

    const changedKeys = Object.keys({ ...previousValues, ...values }).filter(
      key => previousValues[key] !== values[key],
    );
    if (changedKeys.length === 0) return;

    if (changedKeys.every(key => DEBOUNCED_FIELDS.includes(key))) {
      debouncedSearch(values);
    } else {
      // A non-debounced field changed: apply immediately and drop any pending
      // debounced search so a stale one can't land after it.
      debouncedSearch.cancel();
      onSearch(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  return null;
};

export const NotesSearchBar = ({ searchParameters, setSearchParameters, extraActions }) => {
  const { showAdvancedFields, setShowAdvancedFields } = useAdvancedFields(
    ADVANCED_FIELDS,
    searchParameters,
  );
  const { getTranslation } = useTranslation();
  const noteTypeSuggester = useSuggester('noteType', NOTE_TYPE_SUGGESTER_OPTIONS);
  const authorSuggester = useSuggester('practitioner');

  return (
    <Form
      onSubmit={setSearchParameters}
      initialValues={searchParameters}
      enableReinitialize
      formType={FORM_TYPES.SEARCH_FORM}
      render={({ clearForm, values }) => (
        <Container data-testid="notes-search-bar">
          <Row>
            <FieldsArea>
              <FieldsRow>
                <FieldContainer>
                  <Field
                    name="search"
                    label={
                      <TranslatedText stringId="note.search.notes.label" fallback="Notes search" />
                    }
                    component={SearchField}
                    data-testid="field-notes-search"
                  />
                </FieldContainer>
                <FieldContainer>
                  <Field
                    name="noteTypeId"
                    label={
                      <TranslatedText stringId="note.search.noteType.label" fallback="Note type" />
                    }
                    component={AutocompleteField}
                    suggester={noteTypeSuggester}
                    size="small"
                    data-testid="field-notes-type"
                  />
                </FieldContainer>
                <FieldContainer>
                  <Field
                    name="authorId"
                    label={
                      <TranslatedText stringId="note.search.author.label" fallback="Author" />
                    }
                    component={AutocompleteField}
                    suggester={authorSuggester}
                    size="small"
                    data-testid="field-notes-author"
                  />
                </FieldContainer>
              </FieldsRow>
              {showAdvancedFields && (
                <FieldsRow>
                  <FieldContainer>
                    <Field
                      name="fromDate"
                      label={
                        <TranslatedText stringId="general.dateFrom.label" fallback="Date from" />
                      }
                      component={DateField}
                      $joined
                      data-testid="field-notes-from-date"
                    />
                  </FieldContainer>
                  <FieldContainer>
                    <Field
                      name="toDate"
                      label={
                        <TranslatedText stringId="general.dateTo.label" fallback="Date to" />
                      }
                      component={DateField}
                      data-testid="field-notes-to-date"
                    />
                  </FieldContainer>
                  {/* Spacer so this row has the same three columns as the row above,
                      keeping the date fields the same width. */}
                  <FieldContainer aria-hidden />
                </FieldsRow>
              )}
            </FieldsArea>
            <Actions>
              <ThemedTooltip
                title={
                  showAdvancedFields ? (
                    <TranslatedText
                      stringId="general.search.hideAdvanced"
                      fallback="Hide advanced search"
                    />
                  ) : (
                    <TranslatedText
                      stringId="general.search.advanced"
                      fallback="Advanced search"
                    />
                  )
                }
              >
                <IconButton
                  aria-expanded={showAdvancedFields}
                  aria-label={
                    showAdvancedFields
                      ? getTranslation('general.search.hideAdvanced', 'Hide advanced search')
                      : getTranslation('general.search.showAdvanced', 'Show advanced search')
                  }
                  onClick={() => setShowAdvancedFields(previous => !previous)}
                  color="primary"
                  style={{ padding: 6 }}
                  data-testid="notes-search-expand"
                >
                  <ExpandIcon aria-hidden />
                </IconButton>
              </ThemedTooltip>
              <ClearButton
                onClick={() => {
                  if (Object.keys(values).length === 0) return;
                  setSearchParameters({});
                  setTimeout(() => clearForm(), 0);
                }}
                data-testid="notes-search-clear"
              >
                <TranslatedText stringId="general.action.clear" fallback="Clear" />
              </ClearButton>
              {extraActions}
            </Actions>
          </Row>
          <NotesSearchAutoSubmit onSearch={setSearchParameters} />
        </Container>
      )}
      data-testid="notes-search-form"
    />
  );
};
