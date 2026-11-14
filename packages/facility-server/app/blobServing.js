import { BLOB_AVAILABILITY_STATES, BLOB_SCANNERS } from '@tamanu/constants';
import { blobWithholdReason } from '@tamanu/database/blobStore';

import { BlobTransferChannel } from './blobTransfer';
import { getServerFacilityIds } from './serverConfig';
import { CentralServerConnection } from './sync';

const SERVES_FROM = [BLOB_AVAILABILITY_STATES.AVAILABLE, BLOB_AVAILABILITY_STATES.AWAITING_FETCH];

// spec: AV
/**
 * The quarantine record syncs from central, so a facility with the link down still refuses known-
 * bad content. Returns the availability to answer with, or null when it serves.
 */
export async function blobServeGate({ settings, models }, hash, stat) {
  const { servePolicy, scanner } = await settings.get('blobStorage.antivirus');
  const quarantined = Boolean(await models.BlobQuarantine.findOne({ where: { hash } }));
  return blobWithholdReason({
    scanVerdict: stat?.scanVerdict ?? null,
    quarantined,
    policy: servePolicy,
    // A blob withheld before it's fetched would never be scanned, so unheld content isn't judged on
    // a verdict. The quarantine still applies.
    scans: Boolean(stat) && scanner !== BLOB_SCANNERS.NONE,
  });
}

// The API process has no sync runtime, so it builds a channel from the same connection legacy
// attachments are read through.
const transferChannelFor = ({ blobCache, blobHealer, blobStore, deviceId }) => {
  if (!blobCache.transferChannel) {
    const channel = new BlobTransferChannel({
      blobStore,
      centralServer: new CentralServerConnection({ deviceId }),
      facilityIds: getServerFacilityIds(),
    });
    blobCache.setTransferChannel(channel);
    // spec: SCRUB
    // Without the channel, the healer here would escalate with the peer rung untried.
    blobHealer.setTransferChannel(channel);
  }
  return blobCache.transferChannel;
};

// spec: ATCH
/**
 * Returns `{ availability }` for a file this server won't serve, or `{ size }` for content readable
 * through the cache.
 */
export async function resolveBlobForRead(req, hash) {
  // spec: SCRUB
  const stat = await req.blobStore.servableStat(hash);

  // spec: AV
  // Asked here before central, so a facility with the link down still withholds known malware.
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
  return SERVES_FROM.includes(availability) ? { size } : { availability };
}
