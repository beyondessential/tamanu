import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../app/views/scheduling/locationBookings/utils', () => ({
  scrollToBeginning: vi.fn(),
  scrollToCell: vi.fn(),
  scrollToThisWeek: vi.fn(),
}));

vi.mock('../../app/api/queries', () => ({
  useUserPreferencesQuery: () => ({ data: undefined }),
}));

vi.mock('../../app/utils/useUrlSearchParams', () => ({
  useUrlSearchParams: () => new URLSearchParams(),
}));

vi.mock('@tamanu/ui-components', async () => {
  const actual = await vi.importActual('@tamanu/ui-components');
  return {
    ...actual,
    useDateTime: () => ({ getCurrentDate: () => '2024-04-12' }),
  };
});

import {
  LOCATION_BOOKINGS_EMPTY_FILTER_STATE,
  LocationBookingsContextProvider,
  useLocationBookingsContext,
} from '../../app/contexts/LocationBookings';

const ShowFilters = () => {
  const { filters } = useLocationBookingsContext();
  return <span data-testid="filters">{JSON.stringify(filters)}</span>;
};

describe('LocationBookingsContextProvider', () => {
  it('initialises filters to the empty filter state with no extra keys', () => {
    render(
      <LocationBookingsContextProvider>
        <ShowFilters />
      </LocationBookingsContextProvider>,
    );

    const filters = JSON.parse(screen.getByTestId('filters').textContent);
    expect(filters).toStrictEqual(LOCATION_BOOKINGS_EMPTY_FILTER_STATE);
  });
});
