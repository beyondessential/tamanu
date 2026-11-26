import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { SettingsContext } from '@tamanu/ui-components';
import {
  ENCOUNTER_TYPES,
  PROGRAM_DATA_ELEMENT_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../helpers';
import { NestedVitalsModal } from '../../app/components/NestedVitalsModal';

// A triage can be started from the appointment popper in scheduling, which sits outside the
// patient routes and so outside EncounterProvider. The vitals form it nests must render there:
// reading the encounter context throws outside the provider, which showed the error page.
// EncounterProvider is deliberately not mocked or mounted here.

vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  useDateTime: () => ({ getCurrentDateTime: () => '2026-07-12 00:00:00' }),
}));

vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' }, ability: { can: () => true } }),
}));

vi.mock('../../app/api/queries', () => ({
  useVitalsSurveyQuery: () => ({
    data: {
      id: 'vitals-survey',
      components: [
        {
          id: 'component-heart-rate',
          dataElementId: 'pde-heart-rate',
          dataElement: {
            id: 'pde-heart-rate',
            type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
            name: 'Heart rate',
            defaultText: 'Heart rate',
          },
          text: 'Heart rate',
          config: '',
          validationCriteria: '',
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
          screenIndex: 0,
          componentIndex: 0,
        },
      ],
    },
    isSuccess: true,
  }),
  usePatientAdditionalDataQuery: () => ({ data: {}, isSuccess: true }),
}));

const NestedVitalsField = () => (
  <SettingsContext.Provider value={{ getSetting: () => undefined }}>
    <NestedVitalsModal
      field={{ name: 'vitals', onChange: vi.fn() }}
      patient={{ id: 'patient-1' }}
      encounterType={ENCOUNTER_TYPES.TRIAGE}
    />
  </SettingsContext.Provider>
);

describe('NestedVitalsModal', () => {
  it('opens the vitals form without an encounter in context', async () => {
    renderElementWithTranslatedText(<NestedVitalsField />);

    fireEvent.click(screen.getByText('Record vitals'));

    expect(await screen.findByText('Heart rate')).toBeTruthy();
  });
});
