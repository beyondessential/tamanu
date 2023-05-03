import { FhirCodeableConcept, FhirCoding, FhirExtension } from '../../services/fhirTypes';
import { withConfig } from '../../utils/withConfig';

function getEthnicity(ethnicityId) {
  switch (ethnicityId) {
    case 'ethnicity-ITaukei':
      return { code: '36111', display: 'Fijian/iTaukei' };
    case 'ethnicity-FID':
      return { code: '43112', display: 'Fijian Indian' };
    case null:
    case undefined:
      return { code: '99999', display: 'Not Stated' };
    default:
      return { code: '61199', display: 'Other Ethnicity nec' };
  }
}

export const nzEthnicity = withConfig((patient, config) => {
  if (!config.localisation.data.features.fhirNewZealandEthnicity) return [];
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
});
