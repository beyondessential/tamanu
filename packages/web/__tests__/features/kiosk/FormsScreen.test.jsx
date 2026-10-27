import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { APPOINTMENT_STATUSES, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { DateTimeProviderContext, SettingsContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../helpers';
import { FormsScreen } from '../../../app/views/kiosk/screens/FormsScreen';

const kiosk = vi.hoisted(() => ({ session: null, now: null }));

vi.mock('../../../app/views/kiosk/KioskSession', async importOriginal => {
  const actual = await importOriginal();
  const { useReducer } = await import('react');
  const atForms = sessionReducer =>
    sessionReducer(sessionReducer(actual.initialSession, { type: 'start' }), {
      type: 'confirmed',
      appointment: { id: 'appointment-1', status: APPOINTMENT_STATUSES.CONFIRMED },
    });
  return {
    ...actual,
    useKioskSession: () => {
      const [session, dispatch] = useReducer(actual.sessionReducer, actual.sessionReducer, atForms);
      kiosk.session = session;
      return { session, dispatch };
    },
  };
});

vi.mock('../../../app/views/kiosk/kioskApi', () => ({
  useKioskAppointmentQuery: () => ({
    isLoading: false,
    isError: false,
    data: {
      appointment: { id: 'appointment-1', startTime: '2026-10-23 09:30:00' },
      patient: { id: 'patient-1', firstName: 'Tess', lastName: 'Lavea', dateOfBirth: '1986-03-14' },
      patientAdditionalData: null,
      forms: [
        {
          id: 'survey-1',
          name: 'Health questions',
          components: [
            {
              id: 'component-Intro',
              dataElementId: 'pde-Intro',
              dataElement: {
                id: 'pde-Intro',
                code: 'Intro',
                type: PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION,
              },
              text: 'Welcome',
              screenIndex: 0,
              componentIndex: 0,
              visibilityStatus: 'current',
              visibilityCriteria: '',
            },
          ],
        },
      ],
    },
  }),
  useKioskCheckInMutation: () => ({ mutate: () => {}, isLoading: false, isError: false }),
}));

describe('Kiosk forms screen', () => {
  it('records when the form opened on arrival was shown, not when it was finished', async () => {
    kiosk.now = '2026-10-23 09:00:00';
    renderElementWithTranslatedText(
      <DateTimeProviderContext.Provider
        value={{
          getCurrentDate: () => kiosk.now.slice(0, 10),
          getCurrentDateTime: () => kiosk.now,
          formatTime: value => value,
        }}
      >
        <SettingsContext.Provider value={{ getSetting: () => undefined }}>
          <FormsScreen />
        </SettingsContext.Provider>
      </DateTimeProviderContext.Provider>,
    );
    expect(screen.getByText('Welcome')).toBeDefined();

    kiosk.now = '2026-10-23 09:04:00';
    await userEvent.click(screen.getByTestId('kiosk-form-next'));

    expect(kiosk.session.formProgress['survey-1']).toMatchObject({
      status: 'completed',
      startTime: '2026-10-23 09:00:00',
      endTime: '2026-10-23 09:04:00',
    });
  });
});
