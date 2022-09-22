import asyncHandler from 'express-async-handler';
import { Unsupported } from './errors';
import { normaliseParameters } from './parameters';

export function resourceHandler() {
  return asyncHandler(async (req, res) => {
    const method = req.method;
    if (method != 'GET') throw new Unsupported('methods other than get are not supported');

    const path = req.path.split('/').slice(1);
    if (path.length > 1) throw new Unsupported('nested paths are not supported');

    const FhirResource = req.store.models[`Fhir${path[0]}`];
    if (!FhirResource) throw new Unsupported('this resource is not supported');

    const parameters = normaliseParameters(FhirResource);
    console.log(parameters);
    const searchReq = parseRequest(req, parameters);

    res.send({
      searchReq,
    });
  });
}

function parseRequest(req, parameters) {
  const method = req.method;
  const path = req.path.split('/').slice(1);
  const query = Object.entries(req.query).map(([name, value]) => {
    const [param, ...modifiers] = name.split(':');
    if (!parameters.has(param)) throw new Unsupported(`parameter is not supported: ${param}`);

    return {
      param,
      modifiers,
      value: value.split(',').map(part => parameters.get(param).parameterSchema.validateSync(part)),
    };
  });

  return { method, path, query };
}
