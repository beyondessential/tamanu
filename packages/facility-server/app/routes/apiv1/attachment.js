import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';
import { readBlobAsBase64, serveBlob } from '@tamanu/shared/utils/serveBlob';

import { blobServeGate } from '../../blobServing';
import { BlobTransferChannel } from '../../blobTransfer';
import { getServerFacilityIds } from '../../serverConfig';
import { CentralServerConnection } from '../../sync';

const SAFE_ID_REGEX = /^[A-Za-z0-9-]+$/;
const ID_SCHEMA = yup
  .string()
  .matches(SAFE_ID_REGEX, 'id must not have spaces or punctuation other than -');

export const attachment = express.Router();

// Content this server does not hold is resolved from central on demand. The API
// process runs no sync runtime and so has no channel of its own; it builds one
// from the same kind of connection this route already opens to read a legacy
// attachment through.
const transferChannelFor = ({ blobCache, blobHealer, blobStore, deviceId }) => {
  if (!blobCache.transferChannel) {
    const channel = new BlobTransferChannel({
      blobStore,
      centralServer: new CentralServerConnection({ deviceId }),
      facilityIds: getServerFacilityIds(),
    });
    blobCache.setTransferChannel(channel);
    // spec: SCRUB — a read here can detect corruption, and the healer grades
    // that fault in this process too. Without the channel it would reach the
    // escalation rung with the peer rung untried.
    blobHealer.setTransferChannel(channel);
  }
  return blobCache.transferChannel;
};

attachment.get(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Attachment');

    const { query, params, deviceId, blobCache } = req;
    const base64 = await yup.boolean().default(false).validate(query?.base64);
    const id = await ID_SCHEMA.required().validate(params.id);

    const localAttachment = await req.models.Attachment.findByPk(id);

    // spec: ATCH
    // A hash-backed attachment is served from the local store, resolving the
    // bytes from central on a miss and caching them. Serving goes through the
    // cache's open so the read defers eviction for its whole window and counts
    // as a use.
    if (localAttachment?.hash) {
      const { hash, type } = localAttachment;

      // spec: AV
      // Asked of this server before central, so a facility with the link down
      // still withholds content the deployment has found to be malware: the
      // quarantine record reached it by sync and does not need central to be
      // reachable to apply.
      const withheldLocally = await blobServeGate(
        { settings: req.settings[getServerFacilityIds()[0]], models: req.models },
        hash,
        await req.blobStore.stat(hash),
      );
      if (withheldLocally) {
        res.status(202).send({ attachmentId: id, availability: withheldLocally });
        return;
      }

      const channel = transferChannelFor(req);
      const { availability, size } = await channel.availability(hash);

      // spec: ATCH, AV
      // Anything short of available presents as an existing file that is not
      // being served yet, carrying the reason: awaiting upload from its origin,
      // awaiting a scan central has not run, or withheld as infected. Content
      // central holds and will serve is fetched below.
      if (availability !== BLOB_AVAILABILITY_STATES.AVAILABLE) {
        res.status(202).send({ attachmentId: id, availability });
        return;
      }

      if (base64) {
        res.send({ data: await readBlobAsBase64({ size, open: () => blobCache.open(hash) }) });
        return;
      }

      await serveBlob(req, res, {
        hash,
        size,
        contentType: type,
        open: range => blobCache.open(hash, range),
      });
      return;
    }

    if (localAttachment) {
      if (base64) {
        res.send({ data: Buffer.from(localAttachment.data).toString('base64') });
      } else {
        res.setHeader('Content-Type', localAttachment.type);
        res.setHeader('Content-Length', localAttachment.size);
        res.send(Buffer.from(localAttachment.data));
      }
      return;
    }

    // spec: ATCH
    // Legacy attachments reside only on the central server, so an attachment
    // with no local record is served by reading it through central.
    const centralServer = new CentralServerConnection({ deviceId });
    const response = await centralServer.fetch(
      `attachment/${encodeURIComponent(id)}?base64=${base64}`,
      {
        method: 'GET',
        backoff: { maxAttempts: 5, maxWaitMs: 1000 },
      },
    );
    res.send(response);
  }),
);
