import { FhirCodeableConcept, FhirCoding, FhirExtension } from '@tamanu/shared/services/fhirTypes';
import { withConfig } from '@tamanu/shared/utils/withConfig';
import type { Patient } from '../../models';

function getEthnicity(ethnicityId?: string) {
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

export const nzEthnicity = withConfig((patient: Patient, config: Record<string, any>) => {
  if (!config.integrations.fhir.extensions.Patient.newZealandEthnicity) return [];
  const { code, display } = getEthnicity(patient?.additionalData?.[0]?.ethnicityId);

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
