
import asyncHandler from 'express-async-handler';

import { OperationOutcome } from '@tamanu/shared/utils/fhir';
import { FHIR_INTERACTIONS, JOB_TOPICS } from '@tamanu/constants';
import * as Handlers from './handlers';


async function mapErr(promise, fn) {
  try {
    return await promise;
  } catch (err) {
    throw fn(err);
  }
}

export function bundleHandler() {
  return asyncHandler(async (req, res) => {
    // const validated = await mapErr(
    //   bundlesCommon.validate(req.body, { stripUnknown: true }),
    //   err => OperationOutcome.fromYupError(err),
    // );

    let useHandler = null;
    for (const CurrentHandler of Object.values(Handlers)) {
      // console.log(`CurrentHandler: ${CurrentHandler.HANDLER_NAME}`)
      const isMatch = await CurrentHandler.matchBundle(req.body);
      if (isMatch) {
        //  console.log(`body is valid of type ${CurrentHandler.HANDLER_NAME}`);
        useHandler = new CurrentHandler(req.body);
        await useHandler.initialize();
        break;
      }
    }
    // if (!useHandler || !await CurrentHandler.isBundleValid(req.body)) {
    //   throw new OperationOutcome('Bundle does not match any supported formats');
    // }
    const responseBody = await useHandler.processBundle(req);

    // const resource = new FhirResource(validated);
    // const upstream = await resource.pushUpstream({
    //   requesterId: req.user?.id,
    // });
    // if (FhirResource.CAN_DO.has(FHIR_INTERACTIONS.INTERNAL.MATERIALISE)) {
    //   FhirJob.submit(JOB_TOPICS.FHIR.REFRESH.FROM_UPSTREAM, {
    //     resource: FhirResource.fhirName,
    //     upstreamId: upstream.id,
    //   });
    // }

    // in spec, we should Location: to the resource, but we don't have it yet
    // TODO: generate ID here, and return it (if resource can be materialised)
    res.status(201).send(responseBody);
  });
}
