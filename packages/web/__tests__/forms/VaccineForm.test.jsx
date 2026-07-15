import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { VACCINE_RECORDING_TYPES } from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../helpers';
import { VaccineForm } from '../../app/forms/VaccineForm';

// Regression test for the patient-data load-failure guard in
// packages/web/app/forms/VaccineForm.jsx.
//
// The error guard previously re-tested isLoadingPatientData (already handled by
// the loading guard above) instead of patientDataError, so a failed patient-data
// fetch fell through and rendered the form with patientData undefined. That
// silently disabled the "date cannot be prior to date of birth" validation. The
// fix checks patientDataError, so the form is replaced by an error screen when
// patient data fails to load.

const { mockUsePatientDataQuery, mockUsePatientCurrentEncounterQuery } = vi.hoisted(() => ({
  mockUsePatientDataQuery: vi.fn(),
  mockUsePatientCurrentEncounterQuery: vi.fn(),
}));

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDateTime: () => ({
      getCurrentDateTime: () => '2026-07-12 00:00:00',
      storedDateTimeToEpochMilliseconds: () => 0,
    }),
    // Render a lightweight marker instead of the real (heavy) form body so we can
    // assert whether the form is shown without mounting the whole field tree.
    Form: () => <div data-testid="vaccine-form-body">Vaccine form fields</div>,
  };
});

vi.mock('../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: () => undefined }),
}));

vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' }, facilityId: 'facility-1' }),
}));

vi.mock('../../app/api/queries', () => ({
  usePatientCurrentEncounterQuery: (...args) => mockUsePatientCurrentEncounterQuery(...args),
}));

vi.mock('../../app/api/queries/usePatientDataQuery', () => ({
  usePatientDataQuery: (...args) => mockUsePatientDataQuery(...args),
}));

const renderVaccineForm = () =>
  renderElementWithTranslatedText(
    <VaccineForm
      onCancel={() => {}}
      onSubmit={() => {}}
      patientId="patient-1"
      getScheduledVaccines={async () => []}
      vaccineRecordingType={VACCINE_RECORDING_TYPES.GIVEN}
    />,
  );

describe('VaccineForm patient data load failure', () => {
  beforeEach(() => {
    // Default: both queries resolved with no error. react-query v4 exposes the
    // loading flag as `isLoading` (not v5's `isPending`).
    mockUsePatientCurrentEncounterQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    mockUsePatientDataQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });
  });

  it('shows an error and hides the form when the patient-data query errors', () => {
    mockUsePatientDataQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    });

    renderVaccineForm();

    expect(screen.getByText('Cannot load vaccine form')).toBeTruthy();
    expect(screen.queryByTestId('vaccine-form-body')).toBeNull();
  });

  it('renders the form when patient data loads successfully', () => {
    mockUsePatientDataQuery.mockReturnValue({
      data: { id: 'patient-1', dateOfBirth: '1990-01-01' },
      isLoading: false,
      error: null,
    });

    renderVaccineForm();

    expect(screen.getByTestId('vaccine-form-body')).toBeTruthy();
    expect(screen.queryByText('Cannot load vaccine form')).toBeNull();
  });
});
