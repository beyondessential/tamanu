import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import '../../../../app/utils/errorMessages';
import { renderElementWithTranslatedText } from '../../../helpers';
import { EditEncounterModal } from '../../../../app/views/patients/components/EditEncounterModal';

const { captured, settings } = vi.hoisted(() => ({ captured: {}, settings: {} }));

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useApi: () => ({}),
    useSuggester: () => ({}),
    useSettings: () => ({ getSetting: path => settings[path] }),
    useDateTime: () => ({ getCurrentDateTime: () => '2026-07-12 00:00:00' }),
    Form: ({ validationSchema }) => {
      captured.validationSchema = validationSchema;
      return null;
    },
  };
});

// getLocalisedSchema reads the setting through this context, not the ui-components one.
vi.mock('../../../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: path => settings[path] }),
}));

vi.mock('../../../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ writeAndViewEncounter: () => {} }),
}));

const getSchema = () => {
  renderElementWithTranslatedText(
    <EditEncounterModal open encounter={{ id: 'encounter-1', encounterType: 'admission' }} />,
  );
  return captured.validationSchema;
};

describe('EditEncounterModal patient type validation', () => {
  beforeEach(() => {
    for (const key of Object.keys(settings)) delete settings[key];
  });

  it.each([undefined, null, ''])(
    'rejects a patient type of %j when the field is configured as required',
    async patientBillingTypeId => {
      settings['fields.patientBillingTypeId'] = { required: true };

      await expect(getSchema().validate({ patientBillingTypeId })).rejects.toThrow('Required');
    },
  );

  it('accepts a missing patient type when the field is not required', async () => {
    await expect(getSchema().validate({ patientBillingTypeId: null })).resolves.toBeTruthy();
  });

  it('accepts a selected patient type when the field is configured as required', async () => {
    settings['fields.patientBillingTypeId'] = { required: true };

    await expect(
      getSchema().validate({ patientBillingTypeId: 'billing-type-1' }),
    ).resolves.toBeTruthy();
  });
});
