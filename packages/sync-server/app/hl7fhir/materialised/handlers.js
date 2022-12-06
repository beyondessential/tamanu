import { formatRFC7231 } from 'date-fns';
import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { ValidationError } from 'yup';

import { FHIR_BUNDLE_TYPES, FHIR_RESOURCE_TYPES } from 'shared/constants';
import {
  Invalid,
  OperationOutcome,
  Unsupported,
  NotFound,
  normaliseParameters,
} from 'shared/utils/fhir';

import { Bundle } from './bundle';
import { buildSearchQuery, pushToQuery } from './query';

import { requireClientHeaders as requireClientHeadersMiddleware } from '../../middleware/requireClientHeaders';

export function fhirRoutes({ requireClientHeaders } = {}) {
  const routes = Router();

  if (requireClientHeaders) {
    routes.use(requireClientHeadersMiddleware);
  }

  for (const resource of FHIR_RESOURCE_TYPES) {
    routes.get(`/${resource}/:id`, fetchHandler(resource));
    routes.get(`/${resource}`, searchHandler(resource));
  }

  // TODO: handle method/route errors with FHIR errors
  // and/or use a generic FHIR error handler middleware

  return routes;
}

const fetchHandler = resource =>
  asyncHandler(async (req, res) => {
    res.header('Content-Type', 'application/fhir+json; fhirVersion=4.3');

    try {
      const FhirResource = req.store.models[`Fhir${resource}`];
      const { id } = req.params;

      // TODO: support _summary and _elements
      // const parameters = new Map([
      //   normaliseParameter(['_summary', RESULT_PARAMETERS._summary], {
      //     path: [],
      //     sortable: false,
      //   }),
      // ]);
      // const query = await parseRequest(req, parameters);

      const record = await FhirResource.findByPk(id);
      if (!record) throw new NotFound(`no ${resource} with id ${id}`);

      res.header('Last-Modified', formatRFC7231(record.lastUpdated));
      // TODO: support ETag when we have full versioning support

      // TODO: support _pretty
      res.send(record.asFhir());
    } catch (err) {
      const oo = new OperationOutcome([err]);
      res.status(oo.status()).send(oo.asFhir());
    }
  });

const searchHandler = resource =>
  asyncHandler(async (req, res) => {
    res.header('Content-Type', 'application/fhir+json; fhirVersion=4.3');

    try {
      const FhirResource = req.store.models[`Fhir${resource}`];

      const parameters = normaliseParameters(FhirResource);
      const query = await parseRequest(req, parameters);

      const sqlQuery = buildSearchQuery(query, parameters, FhirResource);
      const total = await FhirResource.count(sqlQuery);
      const records = await FhirResource.findAll(sqlQuery);

      const bundle = new Bundle(FHIR_BUNDLE_TYPES.SEARCHSET, records, {
        total,
      });

      bundle.addSelfUrl(req);

      res.send(bundle.asFhir());
    } catch (err) {
      const oo = new OperationOutcome([err]);
      res.status(oo.status()).send(oo.asFhir());
    }
  });

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
