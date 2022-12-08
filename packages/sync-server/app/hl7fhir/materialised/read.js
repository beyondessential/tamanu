import { formatRFC7231 } from 'date-fns';
import asyncHandler from 'express-async-handler';

import { OperationOutcome, NotFound } from 'shared/utils/fhir';

export function readHandler(FhirResource) {
  return asyncHandler(async (req, res) => {
    res.header('Content-Type', 'application/fhir+json; fhirVersion=4.3');

    try {
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
    } catch (err) {
      const oo = new OperationOutcome([err]);
      res.status(oo.status()).send(oo.asFhir());
    }
  });
}
