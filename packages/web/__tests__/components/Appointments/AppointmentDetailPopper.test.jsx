import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '../../helpers';
import { AppointmentDetailPopper } from '../../../app/components/Appointments/AppointmentDetailPopper/AppointmentDetailPopper';

// vi.mock factories are hoisted above the imports, so the spy has to be hoisted with them.
const { mockGet } = vi.hoisted(() => {
  // Node 22+ has a built-in localStorage global that shadows jsdom's and is undefined unless
  // --localstorage-file is passed; ui-components reads it at module load.
  if (!globalThis.localStorage) {
    globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return { mockGet: vi.fn() };
});

vi.mock('../../../app/api/useApi', () => ({
  useApi: () => ({ get: mockGet }),
}));

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({
    ability: { can: () => true },
    facilityId: 'facility-test',
  }),
}));

vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }));
vi.mock('react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../../app/store', () => ({ reloadPatient: vi.fn() }));

// The popper's children are stubbed out: this test is only about whether the popper itself
// fetches patient data, and CheckInButton queries the same endpoint.
vi.mock(
  '../../../app/components/Appointments/AppointmentDetailPopper/AppointmentDetailsDisplay',
  () => ({ AppointmentDetailsDisplay: () => null }),
);
vi.mock(
  '../../../app/components/Appointments/AppointmentDetailPopper/AppointmentStatusSelector',
  () => ({ AppointmentStatusSelector: () => null }),
);
vi.mock('../../../app/components/Appointments/AppointmentDetailPopper/ControlsRow', () => ({
  ControlsRow: () => null,
}));
vi.mock('../../../app/components/Appointments/AppointmentDetailPopper/PatientDetailsDisplay', () => ({
  PatientDetailsDisplay: () => null,
}));
vi.mock('../../../app/components/Appointments/AppointmentDetailPopper/CheckInButton', () => ({
  CheckInButton: () => null,
}));

const PATIENT_ID = 'patient-abc';
const ADDITIONAL_DATA_ENDPOINT = `patient/${PATIENT_ID}/additionalData`;

const appointment = {
  id: 'appointment-1',
  patient: { id: PATIENT_ID, displayId: 'ABC123', firstName: 'Test', lastName: 'Patient' },
};

const renderPopper = open =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <AppointmentDetailPopper
        open={open}
        anchorEl={document.createElement('div')}
        appointment={appointment}
        onClose={() => {}}
        onCancel={() => {}}
        onEdit={() => {}}
      />
    </QueryClientProvider>,
  );

const additionalDataCalls = () =>
  mockGet.mock.calls.filter(([endpoint]) => endpoint === ADDITIONAL_DATA_ENDPOINT);

describe('AppointmentDetailPopper', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({});
  });

  // Regression: the popper mounts once per appointment tile, so fetching on mount meant a
  // calendar of N appointments fired N patient requests before anyone opened anything.
  it('does not fetch patient additional data while closed', async () => {
    renderPopper(false);

    // Give an errant query a chance to fire before asserting that it did not.
    await waitFor(() => expect(mockGet).not.toHaveBeenCalled());
    expect(additionalDataCalls()).toHaveLength(0);
  });

  it('fetches patient additional data once opened', async () => {
    renderPopper(true);

    await waitFor(() => expect(additionalDataCalls()).toHaveLength(1));
    expect(mockGet).toHaveBeenCalledWith(ADDITIONAL_DATA_ENDPOINT, {
      facilityId: 'facility-test',
    });
  });
});
