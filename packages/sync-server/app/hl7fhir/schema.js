import * as yup from 'yup';
import config from 'config';
import { isArray } from 'lodash';

import { decodeIdentifier } from './utils';

export const IDENTIFIER_NAMESPACE = config.hl7.dataDictionaries.patientDisplayId;
const MAX_RECORDS = 20;

const sharedQuery = yup.object({
  'subject:identifier': yup
    .string()
    .test(
      'is-correct-format-and-namespace',
      'subject:identifier must be in the format "<namespace>|<id>"',
      value => {
        const [namespace, displayId] = decodeIdentifier(value);
        return namespace === IDENTIFIER_NAMESPACE && !!displayId;
      },
    )
    .required(),
  _count: yup
    .number()
    .integer()
    .min(1)
    .max(MAX_RECORDS)
    .default(MAX_RECORDS)
    .required(),
  _page: yup
    .number()
    .integer()
    .min(0)
    .required(),
  _sort: yup
    .string()
    .oneOf(['-issued'])
    .required(),
  after: yup
    .object({
      id: yup.string().required(),
      createdAt: yup.date().required(),
    })
    .nullable()
    .default(null),
});

export const patient = {
  query: sharedQuery,
};

export const DIAGNOSTIC_REPORT_INCLUDES = {
  RESULT: 'DiagnosticReport:result',
  DEVICE: 'DiagnosticReport:result.device:Device',
};

export const diagnosticReport = {
  query: sharedQuery.shape({
    _include: yup
      .array()
      .of(yup.string().oneOf(Object.values(DIAGNOSTIC_REPORT_INCLUDES)))
      .transform((value, originalValue) => {
        if (isArray(originalValue)) {
          return originalValue;
        }
        return [originalValue];
      }),
    status: yup.string().oneOf(['final']),
  }),
};
