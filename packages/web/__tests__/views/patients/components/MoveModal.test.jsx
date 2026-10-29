import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import '../../../../app/utils/errorMessages';
import { renderElementWithTranslatedText } from '../../../helpers';
import { MoveModal } from '../../../../app/views/patients/components/MoveModal';

const { captured, settings } = vi.hoisted(() => ({ captured: {}, settings: {} }));

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDateTime: () => ({ getCurrentDateTime: () => '2026-07-12 00:00:00' }),
    Form: ({ validationSchema }) => {
      captured.validationSchema = validationSchema;
      return null;
    },
  };
});

vi.mock('../../../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: path => settings[path] }),
}));

vi.mock('../../../../app/api', () => ({
  useSuggester: () => ({}),
}));

vi.mock('../../../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ writeAndViewEncounter: () => {} }),
}));

const validAdmission = {
  examinerId: 'examiner-1',
  departmentId: 'department-1',
  startDate: '2026-07-11 10:00:00',
};

const getSchema = () => {
  renderElementWithTranslatedText(
    <MoveModal open encounter={{ id: 'encounter-1' }} newEncounterType="admission" />,
  );
  return captured.validationSchema;
};

describe('MoveModal patient type validation', () => {
  beforeEach(() => {
    for (const key of Object.keys(settings)) delete settings[key];
  });

  it.each([undefined, null, ''])(
    'rejects a patient type of %j when the field is configured as required',
    async patientBillingTypeId => {
      settings['fields.patientBillingTypeId'] = { required: true };

      await expect(
        getSchema().validate({ ...validAdmission, patientBillingTypeId }),
      ).rejects.toThrow('Required');
    },
  );

  it('accepts a missing patient type when the field is not required', async () => {
    await expect(
      getSchema().validate({ ...validAdmission, patientBillingTypeId: null }),
    ).resolves.toBeTruthy();
  });

  it('accepts a selected patient type when the field is configured as required', async () => {
    settings['fields.patientBillingTypeId'] = { required: true };

    await expect(
      getSchema().validate({ ...validAdmission, patientBillingTypeId: 'billing-type-1' }),
    ).resolves.toBeTruthy();
  });
});
