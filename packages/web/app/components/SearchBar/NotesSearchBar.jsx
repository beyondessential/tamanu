import React, { useEffect, useMemo, useRef } from 'react';
import { useFormikContext } from 'formik';
import { debounce } from 'es-toolkit/compat';
import { NOTE_TYPES } from '@tamanu/constants';

import { AutocompleteField, DateField, Field, SearchField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useAdvancedFields } from './useAdvancedFields';
import { useSuggester } from '../../api';
import { TranslatedText } from '../Translation/TranslatedText';

// Date filters live in the advanced search drawer.
const ADVANCED_FIELDS = ['fromDate', 'toDate'];

// Only the free text search is debounced; every other filter applies immediately.
const DEBOUNCED_FIELDS = ['search'];

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
  const noteTypeSuggester = useSuggester('noteType', {
    filterer: ({ id }) => id !== NOTE_TYPES.CLINICAL_MOBILE,
  });
  const authorSuggester = useSuggester('practitioner');

  return (
    <CustomisableSearchBar
      showExpandButton
      hideSearchButton
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      onSearch={setSearchParameters}
      initialValues={searchParameters}
      extraActions={extraActions}
      hiddenFields={
        <>
          <Field
            name="fromDate"
            label={<TranslatedText stringId="general.dateFrom.label" fallback="Date from" />}
            component={DateField}
            data-testid="field-notes-from-date"
          />
          <Field
            name="toDate"
            label={<TranslatedText stringId="general.dateTo.label" fallback="Date to" />}
            component={DateField}
            data-testid="field-notes-to-date"
          />
        </>
      }
      data-testid="notes-search-bar"
    >
      <NotesSearchAutoSubmit onSearch={setSearchParameters} />
      <Field
        name="search"
        label={<TranslatedText stringId="note.search.notes.label" fallback="Notes search" />}
        component={SearchField}
        data-testid="field-notes-search"
      />
      <Field
        name="noteTypeId"
        label={<TranslatedText stringId="note.search.noteType.label" fallback="Note type" />}
        component={AutocompleteField}
        suggester={noteTypeSuggester}
        size="small"
        data-testid="field-notes-type"
      />
      <Field
        name="authorId"
        label={<TranslatedText stringId="note.search.author.label" fallback="Author" />}
        component={AutocompleteField}
        suggester={authorSuggester}
        size="small"
        data-testid="field-notes-author"
      />
    </CustomisableSearchBar>
  );
};
