import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useFilterPatientFields } from '../../app/forms/PatientDetailsForm/useFilterPatientFields';

let settings = {};
vi.mock('../../app/contexts/Settings', () => ({
  useSettings: () => ({ getSetting: key => settings[key] }),
}));

// The patient forms render every field group twice, once filtered on each value of
// filterByMandatory, so a field belongs to exactly one of the two renders.
const shownIn = (fields, filterByMandatory) =>
  renderHook(() => useFilterPatientFields({ fields, filterByMandatory })).result.current.fieldsToShow.map(
    field => field.name,
  );

const renders = fields => [shownIn(fields, true), shownIn(fields, false)];

describe('useFilterPatientFields', () => {
  it('puts a field a deployment does not require when creating in the non-mandatory render only', () => {
    settings = { 'fields.familySize.requiredPatientData': false };

    const [mandatory, rest] = renders({ familySize: {} });

    expect(mandatory).toEqual([]);
    expect(rest).toEqual(['familySize']);
  });

  it('puts a field a deployment requires when creating in the mandatory render only', () => {
    settings = { 'fields.familySize.requiredPatientData': true };

    const [mandatory, rest] = renders({ familySize: {} });

    expect(mandatory).toEqual(['familySize']);
    expect(rest).toEqual([]);
  });

  // alwaysShow lets a group pin a field onto the form that collects what a patient must answer
  // when created. It has to pick a side rather than skip the filter: a field answering to
  // neither render appears in both, which is how family size and annual income once showed up
  // in General information and Billing information at the same time.
  it('pins an alwaysShow field to the mandatory render without leaving a copy behind', () => {
    settings = { 'fields.familySize.requiredPatientData': false };

    const [mandatory, rest] = renders({ familySize: { alwaysShow: true } });

    expect(mandatory).toEqual(['familySize']);
    expect(rest).toEqual([]);
  });

  it('keeps an alwaysShow field hidden where the deployment hides it', () => {
    settings = { 'fields.familySize.hidden': true };

    const [mandatory, rest] = renders({ familySize: { alwaysShow: true } });

    expect(mandatory).toEqual([]);
    expect(rest).toEqual([]);
  });

  it('shows a field on a form that does not filter by mandatory at all', () => {
    settings = { 'fields.familySize.requiredPatientData': true };

    expect(shownIn({ familySize: {} }, undefined)).toEqual(['familySize']);
  });
});
