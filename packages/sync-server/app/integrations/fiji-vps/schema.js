import * as yup from 'yup';

const IDENTIFIER_NAMESPACE = 'VPS'; // TODO: what's namespace_for_application_permit_id?
export const IDENTIFIER_REGEXP = new RegExp(`^${IDENTIFIER_NAMESPACE}|([a-zA-Z0-9]*)$`);
const MAX_RECORDS = 100;

const sharedQuery = yup.object({
  'subject:identifier': yup
    .string()
    .matches(IDENTIFIER_REGEXP)
    .required(),
  status: yup
    .string()
    .oneOf(['final'])
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
});

export const patient = {
  query: sharedQuery,
};

export const diagnosticReport = {
  query: sharedQuery,
};

export const observation = {
  query: sharedQuery.shape({
    _include: yup.string().oneOf(['DiagnosticReport:result']),
  }),
};
