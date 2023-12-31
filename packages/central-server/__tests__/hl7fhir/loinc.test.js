import { chance } from '@tamanu/shared/test-helpers';
import { labTestTypeToLOINCCode } from '../../app/hl7fhir/loinc';

describe('HL7 LOINC', () => {
  it('returns "Immunoassay" for a swab', () => {
    const result = labTestTypeToLOINCCode({
      name: chance.pickone([
        'COVID-19 Nasopharyngeal Swab',
        'COVID-19 Nasal Swab',
        'COVID-19 Oropharyngeal Swab',
        'COVID-19 Endotracheal aspirate',
      ]),
    });
    expect(result).toEqual({
      text: 'SARS-CoV-2 (COVID-19) Ag [Presence] in Upper respiratory specimen by Immunoassay',
      coding: [
        {
          system: 'http://loinc.org',
          code: '96119-3',
          display:
            'SARS-CoV-2 (COVID-19) Ag [Presence] in Upper respiratory specimen by Immunoassay',
        },
      ],
    });
  });

  it('returns "Rapid immunoassay" for an RDT', () => {
    const result = labTestTypeToLOINCCode({
      name: chance.pickone(['AgRDT Negative, no further testing needed', 'AgRDT Positive']),
    });
    expect(result).toEqual({
      text:
        'SARS-CoV-2 (COVID-19) Ag [Presence] in Upper respiratory specimen by Rapid immunoassay',
      coding: [
        {
          system: 'http://loinc.org',
          code: '97097-0',
          display:
            'SARS-CoV-2 (COVID-19) Ag [Presence] in Upper respiratory specimen by Rapid immunoassay',
        },
      ],
    });
  });

  it('returns an empty object for a non-matching type name', () => {
    const result = labTestTypeToLOINCCode({
      name: chance.sentence({ words: 8 }),
    });
    expect(result).toEqual({
      text: 'Unknown',
      coding: [
        {
          system: 'http://loinc.org',
          code: 'Unknown',
          display: 'Unknown',
        },
      ],
    });
  });
});
