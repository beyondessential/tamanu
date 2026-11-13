import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import '../../app/utils/errorMessages';
import { renderElementWithTranslatedText } from '../helpers';
import { TriageForm } from '../../app/forms/TriageForm';

const { captured, settings, api, invalidatePatientDataQueries } = vi.hoisted(() => ({
  captured: {},
  settings: {},
  api: {},
  invalidatePatientDataQueries: vi.fn(),
}));

vi.mock('../../app/utils', async importOriginal => ({
  ...(await importOriginal()),
  invalidatePatientDataQueries,
}));

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDateTime: () => ({ getCurrentDateTime: () => '2026-07-12 00:00:00' }),
    Form: ({ validationSchema, onSubmit }) => {
      captured.validationSchema = validationSchema;
      captured.onSubmit = onSubmit;
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
  useApi: () => api,
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

describe('TriageForm submission', () => {
  beforeEach(() => {
    api.post = vi.fn().mockResolvedValue({ id: 'triage-1', encounterId: 'encounter-1' });
    api.get = vi.fn().mockResolvedValue({ id: 'encounter-1' });
    invalidatePatientDataQueries.mockClear();
  });

  it('hands the encounter the triage created to onSubmitEncounter', async () => {
    const onSubmitEncounter = vi.fn();
    renderElementWithTranslatedText(
      <TriageForm
        patient={{ id: 'patient-1' }}
        onSubmitEncounter={onSubmitEncounter}
        noRedirectOnSubmit
        withExistingEncounterCheck={onSuccess => onSuccess()}
      />,
    );

    await captured.onSubmit(validTriage);

    expect(api.post).toHaveBeenCalledWith('triage', expect.objectContaining(validTriage));
    expect(api.get.mock.calls[0][0]).toMatchObject({
      template: 'encounter/:encounterId',
      params: { encounterId: 'encounter-1' },
    });
    expect(onSubmitEncounter).toHaveBeenCalledWith({ id: 'encounter-1' });
    expect(api.post.mock.invocationCallOrder[0]).toBeLessThan(
      onSubmitEncounter.mock.invocationCallOrder[0],
    );
  });

  it('does not call onSubmitEncounter when the triage fails to save', async () => {
    api.post.mockRejectedValue(new Error('Arrival time cannot be in the future'));
    const onSubmitEncounter = vi.fn();
    renderElementWithTranslatedText(
      <TriageForm
        patient={{ id: 'patient-1' }}
        onSubmitEncounter={onSubmitEncounter}
        noRedirectOnSubmit
        withExistingEncounterCheck={onSuccess => onSuccess()}
      />,
    );

    await expect(captured.onSubmit(validTriage)).rejects.toThrow();
    expect(onSubmitEncounter).not.toHaveBeenCalled();
  });

  it('refreshes the patient data even when the created encounter cannot be fetched', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    const onSubmitEncounter = vi.fn();
    renderElementWithTranslatedText(
      <TriageForm
        patient={{ id: 'patient-1' }}
        onSubmitEncounter={onSubmitEncounter}
        noRedirectOnSubmit
        withExistingEncounterCheck={onSuccess => onSuccess()}
      />,
    );

    await expect(captured.onSubmit(validTriage)).rejects.toThrow();

    expect(invalidatePatientDataQueries).toHaveBeenCalledWith(expect.anything(), 'patient-1');
    expect(onSubmitEncounter).not.toHaveBeenCalled();
  });
});
