import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { REFERRAL_STATUSES } from '@tamanu/constants';

import { createQueryClient } from '../helpers';
import { ReferralTable } from '../../app/components/ReferralTable';

const { mockGet, encounterModalProps } = vi.hoisted(() => {
  if (!globalThis.localStorage) {
    globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return { mockGet: vi.fn(), encounterModalProps: vi.fn() };
});

const PATIENT_ID = 'patient-abc';
const patient = { id: PATIENT_ID, displayId: 'ABC123' };
const referral = { id: 'referral-1', status: REFERRAL_STATUSES.PENDING };

vi.mock('../../app/api', () => ({ useApi: () => ({ get: mockGet, put: vi.fn() }) }));
vi.mock('../../app/api/useApi', () => ({ useApi: () => ({ get: mockGet, put: vi.fn() }) }));
vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability: { can: () => true }, facilityId: 'facility-test' }),
}));
vi.mock('../../app/contexts/Patient', () => ({ usePatient: () => ({ patient }) }));
vi.mock('../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ loadEncounter: vi.fn() }),
}));
vi.mock('../../app/components/Translation', () => ({
  TranslatedText: ({ fallback }) => fallback,
  TranslatedEnum: ({ value }) => value,
}));
vi.mock('../../app/components/SurveyResponseDetailsModal', () => ({
  SurveyResponseDetailsModal: () => null,
}));
vi.mock('../../app/components/Table', () => ({
  DataFetchingTable: ({ columns }) => {
    const { CellComponent } = columns.find(({ key }) => key === 'actions');
    return <CellComponent data={referral} />;
  },
}));
vi.mock('../../app/components/MenuButton', () => ({
  MenuButton: ({ actions }) =>
    actions.map(({ label, action }, i) => (
      <button key={i} type="button" onClick={action}>
        {label}
      </button>
    )),
}));
vi.mock('../../app/components/NoteModalActionBlocker', () => ({
  NoteModalActionBlocker: ({ children }) => children,
}));
vi.mock('../../app/components/EncounterModal', () => ({
  EncounterModal: props => {
    encounterModalProps(props);
    return null;
  },
}));

describe('ReferralTable', () => {
  it('passes the patient billing type to the admit encounter modal', async () => {
    mockGet.mockImplementation(async endpoint =>
      endpoint === `patient/${PATIENT_ID}/additionalData`
        ? { patientBillingTypeId: 'billing-1' }
        : {},
    );

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReferralTable patientId={PATIENT_ID} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText('Admit'));

    await waitFor(() =>
      expect(encounterModalProps).toHaveBeenLastCalledWith(
        expect.objectContaining({ patientBillingTypeId: 'billing-1' }),
      ),
    );
  });
});
