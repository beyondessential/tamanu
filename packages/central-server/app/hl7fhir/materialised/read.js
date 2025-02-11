import { formatRFC7231 } from 'date-fns';
import asyncHandler from 'express-async-handler';

import { NotFound } from '@tamanu/shared/utils/fhir';

export function readHandler(FhirResource) {
  return asyncHandler(async (req, res) => {
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
    if (!record) throw new NotFound(`no ${FhirResource.fhirName} with id ${id}`);

    res.header('Last-Modified', formatRFC7231(record.lastUpdated));
    // TODO: support ETag when we have full versioning support
    // TODO: support _pretty
    res.send(record.asFhir());
  });
}
