import {
  toSearchId,
  getBaseUrl,
  hl7SortToTamanu,
  addPaginationToWhere,
  decodeIdentifier,
  getHL7Link,
  parseQuery,
  createBundledResource,
} from './utils';

// TODO (TAN-943): fix auth to throw an error if X-Tamanu-Client and X-Tamanu-Version aren't set

/**
 * For toHL7() and toHL7List(), use either 1 of them depends on your needs
 */
export async function getHL7Payload({
  req,
  querySchema,
  model,
  getWhere,
  getInclude,
  bundleId,
  toHL7,
  toHL7List,
  extraOptions = {},
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
      ...extraOptions,
    }),
    model.count({
      where: baseWhere,
      include,
      ...extraOptions,
    }),
    model.count({
      where: afterWhere,
      include,
      limit: _count + 1, // we can stop once we've found n+1 remaining records
      subQuery: false,
      ...extraOptions,
    }),
  ]);

  let entry = [];

  // If we want to perform expensive operations to transform records,
  // use toHL7List to do all the heavy uplift first (fetch all necessary
  // data) before iterating the records.
  if (toHL7List) {
    const resources = await toHL7List(records, query);
    const bundledResources = resources.map(resource => createBundledResource(baseUrl, resource));
    entry = entry.concat(bundledResources);
  } else {
    // run in a loop instead of using `.map()` so embedded queries run in serial
    const hl7FhirResources = [];
    let hl7FhirIncludedResources = [];
    for (const r of records) {
      const { mainResource, includedResources } = await toHL7(r, query);
      hl7FhirResources.push(createBundledResource(baseUrl, mainResource));
      if (includedResources) {
        hl7FhirIncludedResources = hl7FhirIncludedResources.concat(includedResources);
      }
    }

    entry = entry.concat(hl7FhirResources).concat(hl7FhirIncludedResources);
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
    entry,
  };
}
