/*
 * Tests for SampleDetailsTable.
 *
 * The table is backed entirely by the Formik `sampleDetails` value (a map keyed by categoryId).
 * Entering a collection time makes a category "collected" and defaults its collector to the current
 * user; clearing the time drops the whole category entry so it isn't submitted as a collected
 * sample.
 */

import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Formik } from 'formik';
import { describe, it, expect, vi } from 'vitest';

import { renderElementWithTranslatedText } from '../../helpers';

const { CURRENT_USER_ID } = vi.hoisted(() => ({ CURRENT_USER_ID: 'current-user-1' }));

// The real date picker and autocompletes are heavy widgets; replace them with light stubs so we
// can drive the change handlers directly. The date stub (used for the controlled sampleTime input)
// exposes set/clear buttons; the autocomplete stub writes to its Formik field to simulate a
// selection.
vi.mock('../../../app/components/Field', async () => {
  const actual = await vi.importActual('../../../app/components/Field');
  return {
    ...actual,
    DateTimeInput: props => (
      <>
        <button
          type="button"
          data-testid="set-collection-time"
          onClick={() => props.onChange({ target: { value: '2023-06-12 10:00', name: props.name } })}
        />
        <button
          type="button"
          data-testid="clear-collection-time"
          onClick={() => props.onChange({ target: { value: '', name: props.name } })}
        />
      </>
    ),
    AutocompleteField: props => (
      <button
        type="button"
        data-testid={`autocomplete-${props.field?.name}`}
        onClick={() =>
          props.field?.onChange({ target: { value: 'explicit-collector', name: props.field?.name } })
        }
      />
    ),
  };
});

// SampleDetailsTable reads getCurrentDateTime from useDateTime; stub it so no DateTime provider is
// needed.
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

// SampleDetailsTable defaults the collector to the current user; stub the auth context.
vi.mock('../../../app/contexts/Auth', async () => {
  const actual = await vi.importActual('../../../app/contexts/Auth');
  return {
    ...actual,
    useAuth: () => ({ currentUser: { id: CURRENT_USER_ID } }),
  };
});

import { SampleDetailsTable } from '../../../app/views/labRequest/SampleDetailsTable';

const CATEGORY_ID = 'category-1';
const COLLECTED_BY_FIELD = `sampleDetails.${CATEGORY_ID}.collectedById`;

const noopSuggester = {
  fetchSuggestions: async () => [],
  fetchCurrentOption: async () => undefined,
};

const readSampleDetails = () =>
  JSON.parse(screen.getByTestId('formik-values').textContent).sampleDetails ?? {};

const renderSampleDetails = () =>
  renderElementWithTranslatedText(
    <Formik initialValues={{ sampleDetails: {} }} initialStatus={{}} onSubmit={() => {}}>
      {({ values }) => (
        <>
          <SampleDetailsTable
            samples={[
              {
                categoryId: CATEGORY_ID,
                category: { id: CATEGORY_ID, name: 'Category One' },
                testNames: ['FBC'],
              },
            ]}
            practitionerSuggester={noopSuggester}
            specimenTypeSuggester={noopSuggester}
            labSampleSiteSuggester={noopSuggester}
          />
          <div data-testid="formik-values">{JSON.stringify(values)}</div>
        </>
      )}
    </Formik>,
  );

describe('SampleDetailsTable', () => {
  it('defaults the collector to the current user when a sample time is entered', async () => {
    const user = userEvent.setup();
    renderSampleDetails();

    await user.click(screen.getByTestId('set-collection-time'));

    await waitFor(() => {
      expect(readSampleDetails()[CATEGORY_ID]?.collectedById).toBe(CURRENT_USER_ID);
    });
  });

  it('drops the category entry when the collection time is cleared', async () => {
    const user = userEvent.setup();
    renderSampleDetails();

    await user.click(screen.getByTestId('set-collection-time'));
    await waitFor(() => expect(readSampleDetails()[CATEGORY_ID]).toBeDefined());

    await user.click(screen.getByTestId('clear-collection-time'));

    await waitFor(() => {
      expect(readSampleDetails()[CATEGORY_ID]).toBeUndefined();
    });
  });

  it('does not overwrite a collector that has already been selected', async () => {
    const user = userEvent.setup();
    renderSampleDetails();

    await user.click(screen.getByTestId('set-collection-time'));
    await user.click(screen.getByTestId(`autocomplete-${COLLECTED_BY_FIELD}`));
    // Re-entering a time must not clobber the explicit selection.
    await user.click(screen.getByTestId('set-collection-time'));

    await waitFor(() => {
      expect(readSampleDetails()[CATEGORY_ID]?.collectedById).toBe('explicit-collector');
    });
  });
});
