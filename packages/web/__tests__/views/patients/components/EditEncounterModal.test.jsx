import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import '../../../../app/utils/errorMessages';
import { resolveEndpoint, route } from '@tamanu/api-client';

import { renderElementWithTranslatedText } from '../../../helpers';
import { EditEncounterModal } from '../../../../app/views/patients/components/EditEncounterModal';

const { captured, settings, apiPut } = vi.hoisted(() => ({
  captured: {},
  settings: {},
  apiPut: vi.fn(),
}));

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useApi: () => ({ put: apiPut }),
    useSuggester: () => ({}),
    useSettings: () => ({ getSetting: path => settings[path] }),
    useDateTime: () => ({ getCurrentDateTime: () => '2026-07-12 00:00:00' }),
    Form: ({ validationSchema, initialValues, onSubmit }) => {
      captured.validationSchema = validationSchema;
      captured.initialValues = initialValues;
      captured.onSubmit = onSubmit;
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

const renderModal = encounter => {
  renderElementWithTranslatedText(
    <EditEncounterModal open onClose={vi.fn()} encounter={encounter} />,
  );
  return captured;
};

const getSchema = () =>
  renderModal({ id: 'encounter-1', encounterType: 'admission' }).validationSchema;

const emergencyEncounter = {
  id: 'encounter-1',
  encounterType: 'emergency',
  startDate: '2026-07-11 09:00:00',
  patientBillingTypeId: 'billing-type-private',
  triages: [{ id: 'triage-1', chiefComplaintId: 'complaint-1', score: '2' }],
};

const encounterRoute = route('encounter/:encounterId', { encounterId: 'encounter-1' });
const triageRoute = route('triage/:triageId', { triageId: 'triage-1' });

const triageFormValues = {
  startDate: '2026-07-11 09:00:00',
  chiefComplaintId: 'complaint-1',
  score: '2',
};

beforeEach(() => {
  for (const key of Object.keys(settings)) delete settings[key];
  apiPut.mockReset();
});

describe('EditEncounterModal patient type validation', () => {
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

describe('EditEncounterModal emergency patient type', () => {
  it('prefills the patient type from the encounter', () => {
    expect(renderModal(emergencyEncounter).initialValues.patientBillingTypeId).toBe(
      'billing-type-private',
    );
  });

  it('rejects a missing patient type when the field is configured as required', async () => {
    settings['fields.patientBillingTypeId'] = { required: true };
    const { validationSchema } = renderModal(emergencyEncounter);

    await expect(
      validationSchema.validate({ ...triageFormValues, patientBillingTypeId: null }),
    ).rejects.toThrow('Required');
  });

  it('accepts a missing patient type when the field is not required', async () => {
    const { validationSchema } = renderModal(emergencyEncounter);

    await expect(
      validationSchema.validate({ ...triageFormValues, patientBillingTypeId: null }),
    ).resolves.toBeTruthy();
  });

  it('saves a changed patient type to the encounter before the triage', async () => {
    const { onSubmit } = renderModal(emergencyEncounter);

    await onSubmit({ ...triageFormValues, patientBillingTypeId: 'billing-type-public' });

    expect(apiPut.mock.calls.map(([endpoint]) => resolveEndpoint(endpoint))).toEqual([
      'encounter/encounter-1',
      'triage/triage-1',
      'encounter/encounter-1',
    ]);
    expect(apiPut).toHaveBeenNthCalledWith(1, encounterRoute, {
      submittedTime: '2026-07-12 00:00:00',
      patientBillingTypeId: 'billing-type-public',
    });
    expect(apiPut).toHaveBeenNthCalledWith(
      2,
      triageRoute,
      expect.not.objectContaining({ patientBillingTypeId: expect.anything() }),
    );
  });

  it('does not write the encounter patient type when it is unchanged', async () => {
    const { onSubmit } = renderModal(emergencyEncounter);

    await onSubmit({ ...triageFormValues, patientBillingTypeId: 'billing-type-private' });

    expect(apiPut).toHaveBeenCalledTimes(2);
    expect(apiPut).toHaveBeenNthCalledWith(1, triageRoute, expect.any(Object));
    expect(apiPut).toHaveBeenNthCalledWith(2, encounterRoute, {
      startDate: '2026-07-11 09:00:00',
      skipSystemNotes: true,
    });
  });

  it('leaves the triage untouched when the patient type is refused', async () => {
    apiPut.mockRejectedValueOnce(new Error('Patient billing type not found'));
    const { onSubmit } = renderModal(emergencyEncounter);

    await expect(
      onSubmit({ ...triageFormValues, patientBillingTypeId: 'billing-type-missing' }),
    ).rejects.toThrow('Patient billing type not found');

    expect(apiPut).toHaveBeenCalledTimes(1);
  });

  it('rejects when a later write fails', async () => {
    apiPut.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Server error'));
    const { onSubmit } = renderModal(emergencyEncounter);

    await expect(
      onSubmit({ ...triageFormValues, patientBillingTypeId: 'billing-type-public' }),
    ).rejects.toThrow('Server error');
  });
});
