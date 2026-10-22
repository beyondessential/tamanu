import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fake } from '@tamanu/fake-data/fake';
import { fhirResourceId } from '@tamanu/database/utils/fhir';
import { createTestContext } from '../../utilities';

// spec: FRID
describe('Materialised FHIR - deterministic resource ids', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext({ initFhir: true });
  });
  afterAll(() => ctx.close());

  it('derives the id deterministically from the resource type and upstream id', async () => {
    const { User, FhirPractitioner } = ctx.store.models;
    const user = await User.create(fake(User));

    const mat = await FhirPractitioner.materialiseFromUpstream(user.id);

    expect(mat.id).toBe(fhirResourceId('Practitioner', user.id));
  });

  it('keeps the id unchanged when the same upstream record is re-materialised', async () => {
    const { User, FhirPractitioner } = ctx.store.models;
    const user = await User.create(fake(User));

    const first = await FhirPractitioner.materialiseFromUpstream(user.id);
    const firstId = first.id;
    const second = await FhirPractitioner.materialiseFromUpstream(user.id);

    expect(second.id).toBe(firstId);
    expect(second.id).toBe(fhirResourceId('Practitioner', user.id));
  });

  it('gives a different id per resource type for the same upstream id', async () => {
    const { Patient, FhirPatient } = ctx.store.models;
    const patient = await Patient.create(fake(Patient));

    const mat = await FhirPatient.materialiseFromUpstream(patient.id);

    expect(mat.id).toBe(fhirResourceId('Patient', patient.id));
    expect(fhirResourceId('Patient', patient.id)).not.toBe(
      fhirResourceId('Practitioner', patient.id),
    );
  });
});
