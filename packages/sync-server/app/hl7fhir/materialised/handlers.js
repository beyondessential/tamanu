import asyncHandler from 'express-async-handler';
import { kebabCase } from 'lodash';
import { latestDateTime } from 'shared/utils/dateTime';
import { Unsupported } from './errors';
import { normaliseParameters } from './parameters';
import { buildQuery } from './query';

export function resourceHandler() {
  return asyncHandler(async (req, res) => {
    const { method } = req;
    if (method !== 'GET') throw new Unsupported('methods other than get are not supported');

    const path = req.path.split('/').slice(1);
    if (path.length > 1) throw new Unsupported('nested paths are not supported');

    const FhirResource = req.store.models[`Fhir${path[0]}`];
    if (!FhirResource) throw new Unsupported('this resource is not supported');

    const parameters = normaliseParameters(FhirResource);
    const { query } = parseRequest(req, parameters);

    const sqlQuery = buildQuery(query, parameters, FhirResource);
    const total = await FhirResource.count(sqlQuery);
    const records = await FhirResource.findAll(sqlQuery);

    const resources = records.map(resource => {
      const meta = {
        id: resource.id,
        versionId: resource.versionId,
        lastUpdated: resource.lastUpdated,
      };

      const fields = {};
      for (const [name, attr] of Object.entries(FhirResource.getAttributes())) {
        if (['id', 'versionId', 'upstreamId', 'lastUpdated'].includes(name)) continue;
        fields[name] = resource.get(name);
      }

      return { meta, fields };
    });

    res.send(bundle(resources, total, FhirResource));
  });
}

function parseRequest(req, parameters) {
  const { method } = req;
  const path = req.path.split('/').slice(1);
  const query = new Map(
    Object.entries(req.query).map(([name, value]) => {
      const [param, ...modifiers] = name.split(':');
      if (!parameters.has(param)) throw new Unsupported(`parameter is not supported: ${param}`);

      return [
        param,
        {
          modifiers,
          value: value
            .split(',')
            .map(part => parameters.get(param).parameterSchema.validateSync(part)),
        },
      ];
    }),
  );

  return { method, path, query };
}

function bundle(resources, total, Model) {
  return {
    resourceType: 'Bundle',
    id: kebabCase(Model.name.replace(/^Fhir/, '')),
    meta: {
      lastUpdated: latestDateTime(...resources.map(r => r.meta.lastUpdated)).toISOString(),
    },
    type: 'searchset',
    total,
    link: [
      // {
      //   relation: 'self',
      //   url: ,
      // },
    ],
    entry: resources.map(r => r.fields),
  };
}
