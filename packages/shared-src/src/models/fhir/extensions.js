import config from 'config';
import { FhirCodeableConcept, FhirCoding, FhirExtension } from 'shared/services/fhirTypes';

function getEthnicity(ethnicityId) {
  switch (ethnicityId) {
    case 'ethnicity-Fiji':
      return { code: '36111', display: 'Fijian/iTaukei' };
    case 'ethnicity-FID':
      return { code: '43112', display: 'Fijian Indian' };
    case null:
      return { code: '99999', display: 'Not Stated' };
    default:
      return { code: '61199', display: 'Other Ethnicity nec' };
  }
}

// overrideConfig parameter is just for testing and isn't intended to be used in live code
export function nzEthnicity(patient, overrideConfig = config) {
  if (!overrideConfig.localisation.data.features.fhirNewZealandEthnicity) return [];
  const { code, display } = getEthnicity(patient?.additionalData?.ethnicityId);

  return [
    new FhirExtension({
      url: 'http://hl7.org.nz/fhir/StructureDefinition/nz-ethnicity',
      valueCodeableConcept: new FhirCodeableConcept({
        coding: [
          new FhirCoding({
            system: config.hl7.dataDictionaries.ethnicityId,
            code,
            display,
          }),
        ],
      }),
    }),
  ];
}
