import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AuthContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../../helpers';
import { EncounterActions } from '../../../../app/views/patients/components/EncounterActions';

// No discharge draft for the logged-in clinician, whatever else is asked for.
const getMock = vi.fn().mockResolvedValue({ draft: null });
const navigateToSummaryMock = vi.fn();
const ability = { can: () => true };

vi.mock('../../../../app/api', () => ({
  useApi: () => ({ get: getMock }),
}));

vi.mock('../../../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability }),
}));

vi.mock('../../../../app/utils/usePatientNavigation', () => ({
  usePatientNavigation: () => ({ navigateToSummary: navigateToSummaryMock }),
}));

// The component only takes the note-modal blocker from the barrel; the real one needs the
// note modal context and the rest of the barrel is heavy.
vi.mock('../../../../app/components', () => ({
  NoteModalActionBlocker: ({ children }) => children,
}));

vi.mock('../../../../app/components/DischargeModal', () => ({ DischargeModal: () => null }));
vi.mock('../../../../app/views/patients/components/MoveModal', () => ({ MoveModal: () => null }));
vi.mock('../../../../app/views/patients/components/EditEncounterModal', () => ({
  EditEncounterModal: () => null,
}));
vi.mock('../../../../app/components/PatientPrinting/modals/EncounterRecordModal', () => ({
  EncounterRecordModal: () => null,
}));

const baseEncounter = {
  id: 'encounter-1',
  encounterType: 'clinic',
  startDate: '2023-05-09 13:28:00',
  endDate: null,
};

const renderActions = encounter =>
  renderElementWithTranslatedText(
    // The permission-checked buttons read the ability from the ui-components auth context.
    <AuthContext.Provider value={{ ability }}>
      <EncounterActions encounter={encounter} />
    </AuthContext.Provider>,
  );

describe('EncounterActions', () => {
  it('offers the encounter record and discharge summary for a discharged encounter', async () => {
    renderActions({ ...baseEncounter, endDate: '2023-05-09 23:58:59' });

    expect(await screen.findByRole('button', { name: 'Encounter record' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Discharge summary' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Prepare discharge' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Move patient' })).toBeNull();
  });

  // Encounters closed by the outpatient discharger before v1.26.0 have an end date but no
  // discharge record. The actions come from the end date alone, so they never wait on, or
  // vary with, the discharge endpoint.
  it('does not consult the discharge record to decide what a discharged encounter offers', async () => {
    renderActions({ ...baseEncounter, endDate: '2023-05-09 23:58:59' });

    await screen.findByRole('button', { name: 'Discharge summary' });
    const dischargeCalls = getMock.mock.calls.filter(([url]) => url.endsWith('/discharge'));
    expect(dischargeCalls).toHaveLength(0);
  });

  it('opens the discharge summary', async () => {
    renderActions({ ...baseEncounter, endDate: '2023-05-09 23:58:59' });

    fireEvent.click(await screen.findByRole('button', { name: 'Discharge summary' }));
    expect(navigateToSummaryMock).toHaveBeenCalledTimes(1);
  });

  it('offers discharge and move actions for an active encounter', async () => {
    renderActions(baseEncounter);

    expect(await screen.findByRole('button', { name: 'Prepare discharge' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Move patient' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Discharge summary' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Encounter record' })).toBeNull();
  });
});
