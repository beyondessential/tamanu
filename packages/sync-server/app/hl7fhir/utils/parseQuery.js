import { fromSearchId } from './search';

export function parseQuery(unsafeQuery, querySchema) {
  const { searchId, ...rest } = unsafeQuery;
  let values = rest;
  if (searchId) {
    values = fromSearchId(searchId);
  }
  /*
    Validation notes:
  
    - stripUnknown needs to be false because otherwise yup will
    remove those fields before validation occurs. We want to throw
    an error message when the query has unsupported parameters.
  
    - abortEarly needs to be false because we want to return a list of
    all errors found.
  
    - We can't validate schema strictly because we want defaults for
    required fields and possibly type coercion.
    */
  return querySchema.validate(values, { stripUnknown: false, abortEarly: false });
}
