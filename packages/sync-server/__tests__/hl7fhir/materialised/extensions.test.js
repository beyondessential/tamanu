import config from 'config';
import { nzEthnicity } from 'shared/models/fhir/extensions';

describe('New Zealand ethnicity extension', () => {
  const patient = {
    additionalData: {
      ethnicityId: null,
    },
  };

  it('returns empty array when feature flag is off', () => {
    const extension = nzEthnicity(patient);
    expect(extension).toMatchObject([]);
    expect(extension.length).toBe(0);
  });

  it('returns a fhir extension when feature flag is on', () => {
    const mockConfig = {
      hl7: config.hl7,
      localisation: { data: { features: { fhirNewZealandEthnicity: true } } },
    };
    const extension = nzEthnicity.overrideConfig(patient, mockConfig);
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
