import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  PatientSearchKeys,
  PatientSearchProvider,
  usePatientSearch,
} from '../../app/contexts/PatientSearch';

const SEARCH_PARAMETERS = { displayId: 'ABC123', firstName: 'Jane' };

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
});
