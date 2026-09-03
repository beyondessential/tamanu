/*
 * Regression test for SampleDetailsField.
 *
 * Clearing the "Date & time collected" field abandons the whole sample entry
 * (removeSample deletes it from the submitted sampleDetails). The sibling Formik
 * fields (collectedBy, specimenType, site) must also be reset to undefined so
 * their stale values aren't validated (e.g. mandatory specimen type) and aren't
 * submitted while the sample no longer exists.
 */

import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Formik } from 'formik';
import { describe, it, expect, vi } from 'vitest';

import { renderElementWithTranslatedText } from '../../helpers';

const { CURRENT_USER_ID } = vi.hoisted(() => ({ CURRENT_USER_ID: 'current-user-1' }));

// The real "Date & time collected" input is a heavy MUI date picker. Replace it
// (and the sibling autocompletes) with light stubs so we can drive the change
// handlers directly; the logic under test lives in SampleDetailsField, not in
// these field widgets. The date stub exposes buttons to set and clear a time;
// the autocomplete stub exposes a button to simulate an explicit selection.
vi.mock('../../../app/components/Field', async () => {
  const actual = await vi.importActual('../../../app/components/Field');
  return {
    ...actual,
    DateTimeField: props => (
      <>
        <button
          type="button"
          data-testid="set-collection-time"
          onClick={() =>
            props.onChange({ target: { value: '2023-06-12 10:00', name: props.field?.name } })
          }
        />
        <button
          type="button"
          data-testid="clear-collection-time"
          onClick={() => props.onChange({ target: { value: '', name: props.field?.name } })}
        />
      </>
    ),
    AutocompleteField: props => (
      <button
        type="button"
        data-testid={`autocomplete-${props.field?.name}`}
        onClick={() =>
          props.onChange({ target: { value: 'explicit-collector', name: props.field?.name } })
        }
      />
    ),
  };
});

// SampleDetailsField reads getCurrentDateTime from useDateTime; provide a stub so
// it does not need a full DateTime provider.
vi.mock('@tamanu/ui-components', async () => {
  const actual = await vi.importActual('@tamanu/ui-components');
  return {
    ...actual,
    useDateTime: () => ({ getCurrentDateTime: () => '2023-06-12 10:00' }),
  };
});

// getSetting resolves the mandatory-specimen-type feature flag.
vi.mock('../../../app/contexts/Settings', async () => {
  const actual = await vi.importActual('../../../app/contexts/Settings');
  return {
    ...actual,
    useSettings: () => ({ getSetting: () => true }),
  };
});

// SampleDetailsField defaults the collector to the current user; stub the auth context.
vi.mock('../../../app/contexts/Auth', async () => {
  const actual = await vi.importActual('../../../app/contexts/Auth');
  return {
    ...actual,
    useAuth: () => ({ currentUser: { id: CURRENT_USER_ID } }),
  };
});

import {
  SampleDetailsField,
  SAMPLE_DETAILS_FIELD_PREFIX,
} from '../../../app/views/labRequest/SampleDetailsField';

const IDENTIFIER = 'category-1';
const COLLECTED_BY_FIELD = `${SAMPLE_DETAILS_FIELD_PREFIX}collectedBy-${IDENTIFIER}`;
const SPECIMEN_TYPE_FIELD = `${SAMPLE_DETAILS_FIELD_PREFIX}specimenType-${IDENTIFIER}`;
const SITE_FIELD = `${SAMPLE_DETAILS_FIELD_PREFIX}labSampleSiteSuggester-${IDENTIFIER}`;
const SAMPLE_TIME_FIELD = `${SAMPLE_DETAILS_FIELD_PREFIX}sampleTime-${IDENTIFIER}`;

const noopSuggester = {
  fetchSuggestions: async () => [],
  fetchCurrentOption: async () => undefined,
};

const readValues = () => JSON.parse(screen.getByTestId('formik-values').textContent);

const renderSampleDetails = ({ onSampleChange = () => {} } = {}) =>
  renderElementWithTranslatedText(
    <Formik
      initialValues={{
        [SAMPLE_TIME_FIELD]: '2023-06-12 09:00',
        [COLLECTED_BY_FIELD]: 'practitioner-1',
        [SPECIMEN_TYPE_FIELD]: 'specimen-type-1',
        [SITE_FIELD]: 'site-1',
      }}
      initialStatus={{}}
      onSubmit={() => {}}
    >
      {({ values }) => (
        <>
          <SampleDetailsField
            initialSamples={[
              {
                categoryId: IDENTIFIER,
                category: { id: IDENTIFIER, name: 'Category One' },
                testNames: ['FBC'],
              },
            ]}
            practitionerSuggester={noopSuggester}
            specimenTypeSuggester={noopSuggester}
            labSampleSiteSuggester={noopSuggester}
            onSampleChange={onSampleChange}
          />
          <div data-testid="formik-values">{JSON.stringify(values)}</div>
        </>
      )}
    </Formik>,
  );

// The submitted sample map is what onSampleChange reports; read the latest one.
const latestSamples = onSampleChange => onSampleChange.mock.calls.at(-1)?.[0] ?? {};

describe('SampleDetailsField', () => {
  it('resets collectedBy, specimenType and site when the collection time is cleared', async () => {
    const user = userEvent.setup();
    renderSampleDetails();

    // Sanity check: the sample fields start populated.
    expect(readValues()[COLLECTED_BY_FIELD]).toBe('practitioner-1');
    expect(readValues()[SPECIMEN_TYPE_FIELD]).toBe('specimen-type-1');
    expect(readValues()[SITE_FIELD]).toBe('site-1');

    await user.click(screen.getByTestId('clear-collection-time'));

    await waitFor(() => {
      const values = readValues();
      expect(values[COLLECTED_BY_FIELD]).toBeUndefined();
      expect(values[SPECIMEN_TYPE_FIELD]).toBeUndefined();
      expect(values[SITE_FIELD]).toBeUndefined();
    });
  });

  it('defaults the collector to the current user when a sample time is entered', async () => {
    const user = userEvent.setup();
    const onSampleChange = vi.fn();
    renderSampleDetails({ onSampleChange });

    await user.click(screen.getByTestId('set-collection-time'));

    await waitFor(() => {
      expect(latestSamples(onSampleChange)[IDENTIFIER]?.collectedById).toBe(CURRENT_USER_ID);
    });
  });

  it('does not overwrite a collector that has already been selected', async () => {
    const user = userEvent.setup();
    const onSampleChange = vi.fn();
    renderSampleDetails({ onSampleChange });

    await user.click(screen.getByTestId('set-collection-time'));
    await user.click(screen.getByTestId(`autocomplete-${COLLECTED_BY_FIELD}`));
    // Re-entering a time must not clobber the explicit selection.
    await user.click(screen.getByTestId('set-collection-time'));

    await waitFor(() => {
      expect(latestSamples(onSampleChange)[IDENTIFIER]?.collectedById).toBe('explicit-collector');
    });
  });
});
