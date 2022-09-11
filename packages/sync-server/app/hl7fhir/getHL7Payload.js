import config from 'config';
import { isArray } from 'lodash';
import {
  toSearchId,
  fromSearchId,
  hl7SortToTamanu,
  addPaginationToWhere,
  decodeIdentifier,
} from './utils';

// TODO (TAN-943): fix auth to throw an error if X-Tamanu-Client and X-Tamanu-Version aren't set

export async function getHL7Payload({
  req,
  querySchema,
  model,
  getWhere,
  getInclude,
  bundleId,
  toHL7,
}) {
  const query = await parseQuery(req.query, querySchema);
  const [, displayId] = decodeIdentifier(query['subject:identifier']);
  const { _count, _page, _sort, after } = query;
  const offset = _count * _page;
  const baseWhere = getWhere(displayId, query);
  const afterWhere = addPaginationToWhere(baseWhere, after);
  const include = getInclude(displayId, query);
  const baseUrl = getBaseUrl(req);

  const [records, total, remaining] = await Promise.all([
    model.findAll({
      where: afterWhere,
      include,
      limit: _count,
      offset,
      order: hl7SortToTamanu(_sort, model.name),
      subQuery: false,
    }),
    model.count({
      where: baseWhere,
      include,
    }),
    model.count({
      where: afterWhere,
      include,
      limit: _count + 1, // we can stop once we've found n+1 remaining records
      subQuery: false,
    }),
  ]);

  // run in a loop instead of using `.map()` so embedded queries run in serial
  const hl7FhirResources = [];
  const hl7FhirIncludedResources = [];
  for (const r of records) {
    const { mainResource, includedResources } = await toHL7(r, query);
    hl7FhirResources.push(mainResource);
    if (includedResources) {
      hl7FhirIncludedResources.push(...includedResources);
    }
  }

  const link = [
    {
      relation: 'self',
      url: getHL7Link(baseUrl, req.query), // use original query
    },
  ];
  const lastRecord = records[records.length - 1];
  if (remaining > records.length) {
    link.push({
      relation: 'next',
      url: getHL7Link(baseUrl, {
        searchId: toSearchId({
          ...query, // use parsed query
          after: lastRecord,
        }),
      }),
    });
  }

  const lastUpdated = records.reduce(
    (acc, r) => (acc > r.updatedAt.getTime() ? acc : r.updatedAt),
    null,
  );

  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
    },
    type: 'searchset',
    timestamp: new Date().toISOString(),
    total,
    link,
    entry: [...hl7FhirResources, ...hl7FhirIncludedResources],
  };
}

function getHL7Link(baseUrl, params) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => {
      const encodedKey = encodeURIComponent(k);
      const toPair = val => `${encodedKey}=${encodeURIComponent(val)}`;
      if (isArray(v)) {
        return v.map(toPair);
      }
      return [toPair(v)];
    })
    .flat()
    .join('&');
  return [baseUrl, query].filter(c => c).join('?');
}

function getBaseUrl(req) {
  return `${config.canonicalHostName}${req.baseUrl}${req.path}`;
}

function parseQuery(unsafeQuery, querySchema) {
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
