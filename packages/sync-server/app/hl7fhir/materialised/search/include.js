import { FHIR_INTERACTIONS, FHIR_SEARCH_PARAMETERS } from '@tamanu/constants';
import { FhirReference } from 'shared/services/fhirTypes/reference';
import { FhirError, Processing, Unsupported } from 'shared/utils/fhir';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';

export function resolveIncludes(models, query, parameters, FhirResource) {
  const includes = new Map();
  const referenceParameters = invertReferenceParameters(parameters);
  const materialisedResources = resourcesThatCanDo(models, FHIR_INTERACTIONS.INTERNAL.MATERIALISE);

  for (const { modifier, resource, parameter, targetType } of flattenIncludes(
    query.get('_include'),
  )) {
    if (modifier) {
      throw new Unsupported(`_include modifiers are not yet supported`);
    }

    if (resource === '*') {
      throw new Unsupported(`_include=* is not yet supported`);
    }

    if (!referenceParameters.has(resource)) {
      throw new Unsupported(`_include=${resource} is not supported on ${FhirResource.fhirName}`);
    }

    if (!materialisedResources.some(({ fhirName }) => fhirName === resource)) {
      throw new Unsupported(`_include=${resource} is not supported (not indexed)`);
      // "indexed" is FHIR-specese for what we call "materialised"
    }

    if (parameter === '*') {
      throw new Unsupported(`_include=${resource}:* is not yet supported`);
    }

    const searchableReferencesForResource = referenceParameters.get(resource);
    if (!searchableReferencesForResource.has(parameter)) {
      throw new Unsupported(
        `_include=${resource}:${parameter} is not supported on ${FhirResource.fhirName}`,
      );
    }

    mapmapPush(includes, resource, parameter, {
      ...searchableReferencesForResource.get(parameter),
      targetType,
    });
  }

  return includes;
}

// In an ideal world, this would not be needed, and instead we'd include the
// references in the initial query. However, Sequelize 6 doesn't support this
// (the upcoming 7 mayyyyybe does), so we have to do it in separate queries.
// It's only one additional query per resource type, so it's not too bad.
export async function retrieveIncludes(models, records, includes, FhirResource) {
  if (!includes?.size) return { included: [], errors: [] };

  const [toFetch, errors] = findIncludesToFetch(records, includes, FhirResource);
  const materialisedResources = resourcesThatCanDo(models, FHIR_INTERACTIONS.INTERNAL.MATERIALISE);

  let included = [];
  for (const [resource, ids] of toFetch.entries()) {
    try {
      const ChildResource = materialisedResources.find(({ fhirName }) => fhirName === resource);
      const includedRecords = await ChildResource.findAll({
        where: {
          id: [...ids],
        },
      });
      included = included.concat(includedRecords);
    } catch (err) {
      errors.push(
        new Processing(`Failed to retrieve included ${resource}(s)`, { diagnostics: err.stack }),
      );
    }
  }

  return { included, errors };
}

function findIncludesToFetch(records, includes, FhirResource) {
  const errors = [];
  const toFetch = new Map();

  for (const [resource, includeParams] of includes.entries()) {
    for (const [parameter, { path, targetType }] of includeParams.entries()) {
      const ids = new Set();

      const referenceTypes = new Set();
      if (targetType) {
        referenceTypes.add(targetType);
      }

      for (const record of records) {
        for (const ref of pathInto(record, path)) {
          // failing to retrieve a reference is not an error
          try {
            const typeId = new FhirReference(ref).fhirTypeAndId();
            if (!typeId) {
              throw new Unsupported(
                `Can't _include=${resource}:${parameter} on ${FhirResource.fhirName}#${record.id} because the reference is not explicit`,
              );
            }

            const { type, id } = typeId;
            if (targetType && type !== targetType) {
              // filter off types if the _include discriminates
              continue;
            }

            ids.add(id);
            referenceTypes.add(type);
          } catch (err) {
            if (err instanceof FhirError) {
              // we collect errors to be nice, even though we're not required to
              errors.push(err);
            } else {
              throw err;
            }
          }
        }
      }

      if (ids.size > 0) {
        for (const referenceType of referenceTypes) {
          toFetch.set(referenceType, ids);
        }
      }
    }
  }

  return [toFetch, errors];
}

function invertReferenceParameters(parameters) {
  const inverted = new Map();
  for (const [searchField, params] of parameters) {
    if (params.type !== FHIR_SEARCH_PARAMETERS.REFERENCE) continue;

    const { referenceTypes } = params;
    for (const referenceType of referenceTypes) {
      mapmapPush(inverted, referenceType, searchField, params);
    }
  }

  return inverted;
}

function mapmapPush(map, key, innerKey, value) {
  const inner = map.get(key) ?? new Map();
  inner.set(innerKey, value);
  map.set(key, inner);
}

function* flattenIncludes(includes) {
  for (const { modifier, value } of includes) {
    for (const vals of value) {
      yield { ...vals, modifier };
    }
  }
}

function* pathInto(record, path) {
  const [field, ...rest] = path;
  const value = record[field];
  if (value === undefined) {
    // yield nothing and return
  } else if (value === null) {
    // yield nothing and return
    // in OUR particular case, we don't care about nulls, but in general we might!
    // if copying or exporting/using this code elsewhere, check what you want to do
  } else if (field === '[]') {
    // iterate over array
    for (const item of value) {
      yield* pathInto(item, rest);
    }
  } else if (rest.length > 0) {
    // more path to go, recurse
    yield* pathInto(value, rest);
  } else {
    // reached the end of the path
    yield value;
  }
}
