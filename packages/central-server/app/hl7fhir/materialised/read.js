import { formatRFC7231 } from 'date-fns';
import asyncHandler from 'express-async-handler';

import { NotFound } from '@tamanu/shared/utils/fhir';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { ValidationError } from '@tamanu/errors';

const UNRESOLVED_RESOURCE_AWAIT_TIMEOUT = 20 * 1000; // 20 seconds
const UNRESOLVED_RESOURCE_AWAIT_BACKOFF = 0.5 * 1000; // 0.5 seconds

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

    let totalAwaitedTime = 0;
    while (!record.resolved && totalAwaitedTime < UNRESOLVED_RESOURCE_AWAIT_TIMEOUT) {
      const nextSleepTime = Math.max(
        Math.min(
          totalAwaitedTime + UNRESOLVED_RESOURCE_AWAIT_BACKOFF,
          UNRESOLVED_RESOURCE_AWAIT_TIMEOUT - totalAwaitedTime,
        ),
        0,
      );
      await sleepAsync(nextSleepTime);
      totalAwaitedTime += nextSleepTime;
      await record.reload();
    }

    if (!record.resolved) {
      throw new ValidationError(
        `Awaiting resource ${FhirResource.fhirName}/${id} resolution timed out after ${totalAwaitedTime}ms`,
      );
    }

    res.header('Last-Modified', formatRFC7231(record.lastUpdated));
    // TODO: support ETag when we have full versioning support
    // TODO: support _pretty
    res.send(record.asFhir());
  });
}
