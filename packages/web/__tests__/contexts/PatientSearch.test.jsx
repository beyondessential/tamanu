import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const preferences = vi.hoisted(() => ({ data: {}, mutate: vi.fn(), user: { id: 'user-1' } }));

vi.mock('../../app/api/queries', () => ({
  useUserPreferencesQuery: () => ({ data: preferences.data }),
}));
vi.mock('../../app/api/mutations', () => ({
  useUserPreferencesMutation: () => ({ mutate: preferences.mutate }),
}));
vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ currentUser: preferences.user, facilityId: 'facility-1' }),
}));

import {
  PatientSearchKeys,
  PatientSearchProvider,
  usePatientSearch,
} from '../../app/contexts/PatientSearch';

const SEARCH_PARAMETERS = { displayId: 'ABC123', firstName: 'Jane', departmentId: 'department-1' };

// Stands in for a listing view: shows its stored parameters and can save new ones
const SearchConsumer = ({ searchKey }) => {
  const { searchParameters, setSearchParameters } = usePatientSearch(searchKey);
  return (
    <>
      <div data-testid={`parameters-${searchKey}`}>{JSON.stringify(searchParameters ?? {})}</div>
      <button type="button" onClick={() => setSearchParameters(SEARCH_PARAMETERS)}>
        search-{searchKey}
      </button>
    </>
  );
};

// Mounts/unmounts the consumer inside a stable provider, simulating navigating
// away from the listing view and back while the app shell stays mounted
const Harness = ({ isConsumerMounted, searchKey }) => (
  <PatientSearchProvider>
    {isConsumerMounted && <SearchConsumer searchKey={searchKey} />}
  </PatientSearchProvider>
);

describe('PatientSearch context', () => {
  beforeEach(() => {
    preferences.data = {};
    preferences.mutate.mockClear();
    preferences.user = { id: 'user-1' };
  });

  it('retains search parameters when the consumer unmounts and remounts', async () => {
    const searchKey = PatientSearchKeys.TriageListingView;
    const { rerender } = render(<Harness isConsumerMounted searchKey={searchKey} />);

    await userEvent.click(screen.getByRole('button', { name: `search-${searchKey}` }));
    expect(screen.getByTestId(`parameters-${searchKey}`).textContent).toBe(
      JSON.stringify(SEARCH_PARAMETERS),
    );

    // navigate away...
    rerender(<Harness isConsumerMounted={false} searchKey={searchKey} />);
    expect(screen.queryByTestId(`parameters-${searchKey}`)).toBeNull();

    // ...and back
    rerender(<Harness isConsumerMounted searchKey={searchKey} />);
    expect(screen.getByTestId(`parameters-${searchKey}`).textContent).toBe(
      JSON.stringify(SEARCH_PARAMETERS),
    );
  });

  it('namespaces parameters per view key', async () => {
    render(
      <PatientSearchProvider>
        <SearchConsumer searchKey={PatientSearchKeys.TriageListingView} />
        <SearchConsumer searchKey={PatientSearchKeys.AdmittedPatientsView} />
      </PatientSearchProvider>,
    );

    await userEvent.click(
      screen.getByRole('button', { name: `search-${PatientSearchKeys.TriageListingView}` }),
    );

    expect(
      screen.getByTestId(`parameters-${PatientSearchKeys.TriageListingView}`).textContent,
    ).toBe(JSON.stringify(SEARCH_PARAMETERS));
    expect(
      screen.getByTestId(`parameters-${PatientSearchKeys.AdmittedPatientsView}`).textContent,
    ).toBe(JSON.stringify({}));
  });

  it("opens with the filters saved in the user's preferences", () => {
    const searchKey = PatientSearchKeys.TriageListingView;
    preferences.data = {
      patientSearchParameters: { [searchKey]: { departmentId: 'department-2' } },
    };
    render(<Harness isConsumerMounted searchKey={searchKey} />);

    expect(screen.getByTestId(`parameters-${searchKey}`).textContent).toBe(
      JSON.stringify({ departmentId: 'department-2' }),
    );
  });

  it('saves the filters, leaving out patient lookups', async () => {
    const searchKey = PatientSearchKeys.TriageListingView;
    render(<Harness isConsumerMounted searchKey={searchKey} />);

    await userEvent.click(screen.getByRole('button', { name: `search-${searchKey}` }));

    expect(preferences.mutate).toHaveBeenLastCalledWith({
      key: 'patientSearchParameters',
      value: { [searchKey]: { departmentId: 'department-1' } },
    });
  });

  it("replaces the last user's parameters with the next user's", async () => {
    const searchKey = PatientSearchKeys.TriageListingView;
    const { rerender } = render(<Harness isConsumerMounted searchKey={searchKey} />);
    await userEvent.click(screen.getByRole('button', { name: `search-${searchKey}` }));

    preferences.user = { id: 'user-2' };
    preferences.data = {
      patientSearchParameters: { [searchKey]: { departmentId: 'department-3' } },
    };
    rerender(<Harness isConsumerMounted searchKey={searchKey} />);

    expect(screen.getByTestId(`parameters-${searchKey}`).textContent).toBe(
      JSON.stringify({ departmentId: 'department-3' }),
    );
  });

  it("doesn't save before the user's preferences load", async () => {
    const searchKey = PatientSearchKeys.TriageListingView;
    preferences.data = undefined;
    render(<Harness isConsumerMounted searchKey={searchKey} />);

    await userEvent.click(screen.getByRole('button', { name: `search-${searchKey}` }));

    expect(preferences.mutate).not.toHaveBeenCalled();
  });

  it("clears the last user's parameters at logout", async () => {
    const searchKey = PatientSearchKeys.TriageListingView;
    const { rerender } = render(<Harness isConsumerMounted searchKey={searchKey} />);
    await userEvent.click(screen.getByRole('button', { name: `search-${searchKey}` }));

    preferences.user = null;
    preferences.data = undefined;
    rerender(<Harness isConsumerMounted searchKey={searchKey} />);

    expect(screen.getByTestId(`parameters-${searchKey}`).textContent).toBe(JSON.stringify({}));
  });
});
