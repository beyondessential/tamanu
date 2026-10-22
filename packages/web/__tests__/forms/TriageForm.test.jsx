import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import '../../app/utils/errorMessages';
import { renderElementWithTranslatedText } from '../helpers';
import { TriageForm } from '../../app/forms/TriageForm';

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

vi.mock('../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: path => settings[path] }),
}));

vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' }, facilityId: 'facility-1' }),
}));

vi.mock('../../app/api', () => ({
  useApi: () => ({}),
  useSuggester: () => ({}),
}));

vi.mock('react-router', () => ({ useNavigate: () => () => {} }));

const validTriage = {
  triageTime: '2026-07-11 10:00:00',
  locationId: 'location-1',
  chiefComplaintId: 'complaint-1',
  practitionerId: 'user-1',
  score: '1',
};

const getSchema = () => {
  renderElementWithTranslatedText(<TriageForm patient={{ id: 'patient-1' }} />);
  return captured.validationSchema;
};

describe('TriageForm patient type validation', () => {
  beforeEach(() => {
    for (const key of Object.keys(settings)) delete settings[key];
  });

  it.each([undefined, null, ''])(
    'rejects a patient type of %j when the field is configured as required',
    async patientBillingTypeId => {
      settings['fields.patientBillingTypeId'] = { required: true };

      await expect(
        getSchema().validate({ ...validTriage, patientBillingTypeId }),
      ).rejects.toThrow('Required');
    },
  );

  it('accepts a missing patient type when the field is not required', async () => {
    await expect(
      getSchema().validate({ ...validTriage, patientBillingTypeId: null }),
    ).resolves.toBeTruthy();
  });

  it('accepts a selected patient type when the field is configured as required', async () => {
    settings['fields.patientBillingTypeId'] = { required: true };

    await expect(
      getSchema().validate({ ...validTriage, patientBillingTypeId: 'billing-type-1' }),
    ).resolves.toBeTruthy();
  });
});
