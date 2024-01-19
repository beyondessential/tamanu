import { nzEthnicity } from '@tamanu/shared/models/fhir/extensions';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { createTestContext } from '../../utilities';

describe('New Zealand ethnicity extension', () => {
  let settings;
  let ctx;
  const patient = {
    additionalData: {
      ethnicityId: null,
    },
  };

  beforeEach(async () => {
    ctx = await createTestContext();
    settings = ctx.settings;
  });

  afterEach(() => ctx.close());

  it('returns empty array when feature flag is off', async () => {
    const extension = await nzEthnicity(patient, settings);
    expect(extension).toMatchObject([]);
    expect(extension.length).toBe(0);
  });

  it('returns a fhir extension when feature flag is on', async () => {
    await ctx.store.models.Setting.create({
      scope: SETTINGS_SCOPES.Central,
      key: 'features.fhirNewZealandEthnicity',
      value: true,
    });

    const extension = await nzEthnicity(patient, settings);
    expect(extension).toMatchObject([
      {
        url: 'http://hl7.org.nz/fhir/StructureDefinition/nz-ethnicity',
        valueCodeableConcept: {
          coding: [
            {
              display: 'Not Stated',
              code: '99999',
              system: 'http://data-dictionary.tamanu-fiji.org/extensions/ethnic-group-code.html',
            },
          ],
        },
      },
    ]);
  });
});
