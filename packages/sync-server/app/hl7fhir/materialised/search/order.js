import { Sequelize } from 'sequelize';
import { FHIR_SEARCH_PARAMETERS, FHIR_SEARCH_TOKEN_TYPES } from 'shared/constants';
import { Unsupported } from 'shared/utils/fhir';

import { findField } from './common';

export function generateOrderClause(query, parameters, FhirResource) {
  let ordering = [];

  for (const { order, by } of query.get('_sort').flatMap(v => v.value)) {
    const def = parameters.get(by);
    if (def.path.length === 0) continue;

    const alternates = def.path.map(([field, ...path]) => {
      const resolvedPath = [findField(FhirResource, field).field, ...path];
      return singleOrder(resolvedPath, order, def, FhirResource);
    });

    ordering = ordering.concat(alternates);
  }

  return ordering;
}

// eslint-disable-next-line no-unused-vars
function singleOrder(path, order, def, _Model) {
  const entirePath = path;
  if (
    def.type === FHIR_SEARCH_PARAMETERS.TOKEN &&
    (def.tokenType === FHIR_SEARCH_TOKEN_TYPES.CODING ||
      def.tokenType === FHIR_SEARCH_TOKEN_TYPES.VALUE)
  ) {
    const valuePath = def.tokenType === FHIR_SEARCH_TOKEN_TYPES.VALUE ? 'value' : 'code';
    entirePath.push(valuePath);
  }

  // optimisation in the simple case
  if (entirePath.length === 1) {
    return [Sequelize.col(entirePath[0]), order];
  }

  // TODO (EPI-202)
  // The generated SQL *works* and the ordering is correct and stable, with one
  // important caveat: the rows are duplicated due to the order by expression
  // returning a setof, which is expanded into mulitple rows. This is not a bug,
  // literally what this query:
  //
  // SELECT * FROM table ORDER BY setreturning_expression();
  //
  // "actually" does is:
  //
  // SELECT *, setreturning_expression() as _ordering FROM table ORDER BY _ordering;
  //
  // except it doesn't return the _ordering "output column".
  //
  // Essentially say you have users with the given names:
  //
  // 1. Albert, Charlie
  // 2. Bob, David
  //
  // and we sort by given name, we get:
  //
  // User#1 (Albert, Charlie) [sorting on: Albert]
  // User#2 (Bob, David) [sorting on: Bob]
  // User#1 (Albert, Charlie) [sorting on: Charlie]
  // User#2 (Bob, David) [sorting on: David]
  //
  // This is perfectly good and correct, but it's not what we want. We want to
  // only return each user once, and only once. Furthermore, we want to do this
  // in SQL, such that offset/limit work as expected. But we are also restricted
  // in what SQL we can do, to preserve performance characteristics.
  //
  // (Why can't we post-process? Well, what does it mean to return the 2nd page
  // when the first page (LIMIT 20) has been reduced to 10 users in post because
  // of duplicates? What does it mean to return the 12th page? Or the 200th?)
  //
  // ((Similarly, it would be impractical to use temporary tables or subqueries,
  // because the ordering is done as a last step in the query processing, and we
  // don't want to duplicate the entire table in memory just to do some dedupe
  // before applying the paging.))
  //
  // (((Why can't we return duplicates? Because the FHIR spec says we can't.
  // See https://hl7.org/fhir/search.html#entries §3.2.1.3.4)))
  throw new Unsupported('order with nested arrays is not supported yet');

  // return [getJsonbQueryFn(entirePath), order];
}
