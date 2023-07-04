import { sample } from 'lodash';
import * as yup from 'yup';

import { FHIR_ENCOUNTER_LOCATION_STATUS } from '../../constants';

import { FhirBaseType } from './baseType';
import { FhirCodeableConcept } from './codeableConcept';
import { FhirPeriod } from './period';
import { FhirReference } from './reference';

const STATUS = Object.values(FHIR_ENCOUNTER_LOCATION_STATUS);

export class FhirEncounterLocation extends FhirBaseType {
  static SCHEMA() {
    return yup
      .object({
        location: FhirReference.asYup().required(),
        status: yup
          .string()
          .oneOf([null, ...STATUS])
          .required(),
        form: FhirCodeableConcept.asYup()
          .nullable()
          .default(null),
        period: FhirPeriod.asYup()
          .nullable()
          .default(null),
      })
      .noUnknown();
  }

  static fake(model, { fieldName }, id) {
    return new this({
      location: FhirReference.fake('Location', { fieldName }, id),
      status: sample(STATUS),
    });
  }
}
