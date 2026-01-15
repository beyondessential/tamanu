import * as yup from 'yup';

import { FhirBaseType } from './baseType';
import { FHIR_BUNDLE_TYPES } from '@tamanu/constants';

export class FhirBundle extends FhirBaseType {
  static SCHEMA() {
    return yup.object({
      resourceType: yup.string().oneOf(['Bundle']).required(),
      type: yup.string().oneOf(Object.values(FHIR_BUNDLE_TYPES)).required(),
    });
  }
}

export class FhirTransactionBundle extends FhirBundle {
  static SCHEMA() {
    return yup.object({
      resourceType: yup.string().oneOf(['Bundle']).required(),
      type: yup.string().oneOf([FHIR_BUNDLE_TYPES.TRANSACTION]).required(),
      entry: yup
        .array()
        .of(
          yup.object({
            resource: yup.object({ resourceType: yup.string().required() }).required(),
            request: yup
              .object({
                // For now just supporting POST as we only support create transactions
                method: yup.string().oneOf(['POST']).required(),
                url: yup.string().required(),
              })
              .required(),
          }),
        )
        .required(),
    });
  }
}

export class FhirTransactionResponseBundle extends FhirBundle {
  static SCHEMA() {
    return yup.object({
      resourceType: yup.string().oneOf(['Bundle']).required(),
      type: yup.string().oneOf([FHIR_BUNDLE_TYPES.TRANSACTION_RESPONSE]).required(),
      response: yup
        .object({
          status: yup.string().required(),
        })
        .required(),
    });
  }
}

export class FhirSearchSetBundle extends FhirBundle {
  static SCHEMA() {
    return yup.object({
      resourceType: yup.string().oneOf(['Bundle']).required(),
      type: yup.string().oneOf([FHIR_BUNDLE_TYPES.SEARCHSET]).required(),
      total: yup.number(),
      timestamp: yup.string().required(),
      link: yup.array().of(
        yup.object({
          relation: yup.string().oneOf(['self', 'next', 'previous']).required(),
          url: yup.string().required(),
        }),
      ),
      entry: yup.array().of(
        yup.object({
          resource: yup.object().required(),
          search: yup.object({
            mode: yup.string().oneOf(['match', 'include', 'outcome']),
          }),
        }),
      ),
    });
  }
}
