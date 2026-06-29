import { FhirCodeableConcept, FhirCoding, FhirExtension } from '@tamanu/shared/services/fhirTypes';
import { getFhirDataDictionaries, getFhirExtensionSettings } from '@tamanu/shared/utils/fhir';
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

export function nzEthnicity(patient: Patient, extensionSettingsOverride?: Record<string, any>) {
  const extensionSettings = extensionSettingsOverride ?? getFhirExtensionSettings();
  if (!extensionSettings?.Patient?.newZealandEthnicity) return [];
  const { code, display } = getEthnicity(patient?.additionalData?.[0]?.ethnicityId);

  return [
    new FhirExtension({
      url: 'http://hl7.org.nz/fhir/StructureDefinition/nz-ethnicity',
      valueCodeableConcept: new FhirCodeableConcept({
        coding: [
          new FhirCoding({
            system: getFhirDataDictionaries().ethnicityId,
            code,
            display,
          }),
        ],
      }),
    }),
  ];
}
