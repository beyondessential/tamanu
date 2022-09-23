import asyncHandler from 'express-async-handler';

import { FHIR_BUNDLE_TYPES } from 'shared/constants';
import { Bundle } from './bundle';

import { OperationOutcome, Unsupported } from './errors';
import { normaliseParameters } from './parameters';
import { buildQuery, pushToQuery } from './query';

export function resourceHandler() {
  return asyncHandler(async (req, res) => {
    try { // TODO: make it a middleware
      const { method } = req;
      if (method !== 'GET') throw new Unsupported('methods other than get are not supported');

      const path = req.path.split('/').slice(1);
      if (path.length > 1) throw new Unsupported('nested paths are not supported');

      const FhirResource = req.store.models[`Fhir${path[0]}`];
      if (!FhirResource) throw new Unsupported('this resource is not supported');

      const parameters = normaliseParameters(FhirResource);
      const query = parseRequest(req, parameters);

      const sqlQuery = buildQuery(query, parameters, FhirResource);
      const total = await FhirResource.count(sqlQuery);
      const records = await FhirResource.findAll(sqlQuery);
      
      const bundle = new Bundle(FHIR_BUNDLE_TYPES.SEARCHSET, records, {
        total
      });

      bundle.addSelfUrl(req);

      res.send(bundle.asFhir());
    } catch (err) {
      // TODO: multiple errors?
      const oo = new OperationOutcome([err]);
      res.status(oo.status()).send(oo.asFhir());
    }
  });
}

function parseRequest(req, parameters) {
  const parsedPairs = Object.entries(req.query)
    .flatMap(([name, values]) =>
      Array.isArray(values) ? values.map(v => [name, v]) : [[name, values]],
    )
    .map(([name, value]) => {
      const [param, modifier] = name.split(':', 2);
      if (!parameters.has(param)) throw new Unsupported(`parameter is not supported: ${param}`);

      return [
        param,
        {
          modifier,
          value: value
            .split(',')
            .map(part => parameters.get(param).parameterSchema.validateSync(part)),
        },
      ];
    });

  const query = new Map();
  for (const [param, parse] of parsedPairs) {
    pushToQuery(query, param, parse);
  }
  return query;
}
