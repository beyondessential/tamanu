import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsContext } from '@tamanu/ui-components';
import { TriageSearchBarAdvancedFields } from '../../app/components/SearchBar/TriageSearchBar';
import { renderElementWithTranslatedText } from '../helpers';

const useSuggesterMock = vi.fn();

vi.mock('../../app/api', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useSuggester: (...args) => useSuggesterMock(...args),
  };
});

vi.mock('../../app/contexts/Settings', () => ({
  useSettings: () => ({
    getSetting: key =>
      key === 'triageCategories' ? [{ level: 1, label: 'Emergency', color: '#f00' }] : undefined,
  }),
}));

const createStubSuggester = () => ({
  fetchCurrentOption: vi.fn().mockResolvedValue(null),
  fetchSuggestions: vi.fn().mockResolvedValue([]),
  createSuggestion: vi.fn(),
});

useSuggesterMock.mockImplementation(() => createStubSuggester());

const LOCATION_VALUE_PROBE = 'location-value-probe';

const getLocationInput = () =>
  screen.getByTestId('field-location-input').querySelector('input');

const renderAdvancedFields = (initialValues = {}) =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider value={{ getSetting: () => undefined }}>
      <Formik
        initialValues={initialValues}
        initialStatus={{ submitStatus: undefined }}
        onSubmit={() => {}}
      >
        {({ values, setFieldValue }) => (
          <>
            <TriageSearchBarAdvancedFields />
            <button type="button" onClick={() => setFieldValue('locationGroupId', 'area-b')}>
              change-area
            </button>
            <button type="button" onClick={() => setFieldValue('locationGroupId', undefined)}>
              clear-area
            </button>
            <div data-testid={LOCATION_VALUE_PROBE}>{values.locationId ?? ''}</div>
          </>
        )}
      </Formik>
    </SettingsContext.Provider>,
  );

describe('TriageSearchBarAdvancedFields', () => {
  afterEach(() => {
    useSuggesterMock.mockClear();
  });

  it('disables the location field until an area is selected', () => {
    renderAdvancedFields({});

    expect(getLocationInput().disabled).toBe(true);
  });

  it('enables the location field once an area is selected', () => {
    renderAdvancedFields({ locationGroupId: 'area-a' });

    expect(getLocationInput().disabled).toBe(false);
  });

  it('filters the location suggester by the selected area', () => {
    renderAdvancedFields({ locationGroupId: 'area-a' });

    expect(useSuggesterMock).toHaveBeenCalledWith('location', {
      baseQueryParameters: { filterByFacility: true, locationGroupId: 'area-a' },
    });
  });

  it('clears the selected location when the area changes', async () => {
    renderAdvancedFields({ locationGroupId: 'area-a', locationId: 'location-1' });

    expect(screen.getByTestId(LOCATION_VALUE_PROBE).textContent).toBe('location-1');

    await userEvent.click(screen.getByRole('button', { name: 'change-area' }));

    await waitFor(() => {
      expect(screen.getByTestId(LOCATION_VALUE_PROBE).textContent).toBe('');
    });
  });

  it('clears and disables the location when the area is cleared', async () => {
    renderAdvancedFields({ locationGroupId: 'area-a', locationId: 'location-1' });

    await userEvent.click(screen.getByRole('button', { name: 'clear-area' }));

    await waitFor(() => {
      expect(screen.getByTestId(LOCATION_VALUE_PROBE).textContent).toBe('');
    });
    expect(getLocationInput().disabled).toBe(true);
  });
});
