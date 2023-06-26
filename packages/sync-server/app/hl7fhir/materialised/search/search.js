import asyncHandler from 'express-async-handler';
import { ValidationError } from 'yup';
import { FHIR_BUNDLE_TYPES } from 'shared/constants';
import { Invalid, OperationOutcome, Unsupported, normaliseParameters } from 'shared/utils/fhir';

import { Bundle } from '../bundle';
import { pushToQuery } from './common';
import { resolveIncludes, retrieveIncludes } from './include';
import { buildSearchQuery } from './query';

export function searchHandler(FhirResource) {
  return asyncHandler(async (req, res) => {
    const parameters = normaliseParameters(FhirResource);
    const query = await parseRequest(req, parameters);

    let includes = null;
    if (query.has('_include')) {
      includes = resolveIncludes(query, parameters, FhirResource);
    }

    const sqlQuery = buildSearchQuery(query, parameters, FhirResource);
    const total = await FhirResource.count(sqlQuery);
    const records = await FhirResource.findAll(sqlQuery);
    const { included, errors } = await retrieveIncludes(records, includes, FhirResource);

    const bundle = new Bundle(FHIR_BUNDLE_TYPES.SEARCHSET, records, {
      total,
    });

    bundle.addSelfUrl(req);
    bundle.addIncluded(included);
    bundle.addIssues(errors);

    res.send(bundle.asFhir());
  });
}

async function parseRequest(req, parameters) {
  const pairs = Object.entries(req.query).flatMap(([name, values]) =>
    Array.isArray(values) ? values.map(v => [name, v]) : [[name, values]],
  );

  const errors = [];
  const query = new Map();
  for (const [name, value] of pairs) {
    const [param, modifier] = name.split(':', 2);
    if (!parameters.has(param)) {
      // TODO: support Prefer: handling=lenient
      errors.push(new Unsupported(`parameter is not supported: ${param}`));
      continue;
    }

    const values = [];
    for (const part of value.split(',')) {
      try {
        values.push(await parameters.get(param).parameterSchema.validate(part));
      } catch (err) {
        if (err instanceof ValidationError) {
          errors.push(OperationOutcome.fromYupError(err, param));
        } else {
          errors.push(
            new Invalid(err.message, {
              expression: param,
            }),
          );
        }
      }
    }

    pushToQuery(query, param, {
      modifier,
      value: values,
    });
  }

  if (errors.length > 0) {
    throw new OperationOutcome(errors);
  }

  return query;
}
