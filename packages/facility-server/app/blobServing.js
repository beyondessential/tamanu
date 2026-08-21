import { BLOB_AVAILABILITY_STATES, BLOB_SCANNERS } from '@tamanu/constants';
import { blobWithholdReason } from '@tamanu/database/blobStore';

import { BlobTransferChannel } from './blobTransfer';
import { getServerFacilityIds } from './serverConfig';
import { CentralServerConnection } from './sync';

// The availability states a read can be satisfied from: content this server
// holds, and content central holds and is willing to serve.
const SERVES_FROM = [BLOB_AVAILABILITY_STATES.AVAILABLE, BLOB_AVAILABILITY_STATES.AWAITING_FETCH];

// spec: AV
/**
 * Whether this facility will serve a blob it holds. The quarantine record is
 * pulled from central, so this answers the same way with the link down as with
 * it up: a facility that has already cached known-bad content still refuses it.
 *
 * Returns the availability state to answer with, or null when the blob serves.
 */
export async function blobServeGate({ settings, models }, hash, stat) {
  const { servePolicy, scanner } = await settings.get('blobStorage.antivirus');
  const quarantined = Boolean(await models.BlobQuarantine.findOne({ where: { hash } }));
  return blobWithholdReason({
    scanVerdict: stat?.scanVerdict ?? null,
    quarantined,
    policy: servePolicy,
    // Content this server does not hold has no verdict of its own to judge, and
    // waiting for one would never end: the scan runs over what is on disk, so a
    // blob withheld before it is fetched is never fetched and so never scanned.
    // The quarantine still applies, naming the hash rather than any copy of it.
    scans: Boolean(stat) && scanner !== BLOB_SCANNERS.NONE,
  });
}

// Content this server does not hold is resolved from central on demand. The API
// process runs no sync runtime and so has no channel of its own; it builds one
// from the same kind of connection a legacy attachment is read through.
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

// spec: ATCH
/**
 * Resolve a hash-backed reference for a read on this facility: the servable
 * gate, then the antivirus gate, then central's view of the hash.
 *
 * Returns `{ availability }` for an existing file this server will not serve,
 * or `{ size }` for content the caller may go on to read through the cache.
 */
export async function resolveBlobForRead(req, hash) {
  // spec: SCRUB — a copy the store will not serve reads as not held, so the read
  // resolves a replacement from central rather than judging bad bytes.
  const stat = await req.blobStore.servableStat(hash);

  // spec: AV
  // Asked of this server before central, so a facility with the link down still
  // withholds content the deployment has found to be malware: the quarantine
  // record reached it by sync and does not need central to be reachable to apply.
  const withheldLocally = await blobServeGate(
    { settings: req.settings[getServerFacilityIds()[0]], models: req.models },
    hash,
    stat,
  );
  if (withheldLocally) {
    return { availability: withheldLocally };
  }

  const { availability, size } = await transferChannelFor(req).availability(hash, { stat });

  // spec: ATCH, AV
  // Available is held here and awaiting-fetch is held by central, which the read
  // resolves. Every other state is an existing file that is not being served,
  // and carries which: awaiting upload from its origin, awaiting a scan central
  // has not run, or withheld as infected.
  return SERVES_FROM.includes(availability) ? { size } : { availability };
}
