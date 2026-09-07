import { Op } from 'sequelize';

import { ERROR_TYPE } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

import { getServerFacilityIds } from '../serverConfig';

// spec: ASSET
// Fetch each asset's bytes as its row arrives through sync, so a certificate or
// patient letter prints without depending on connectivity at print time.
// fetchFromCentral is idempotent and skips content already held, so a full pass
// after each completed sync settles to a cheap no-op once everything is local.
// Asset rows sync everywhere, including other facilities' facility-specific
// assets, so scope the fetch to what this server can actually print with: the
// deployment-wide assets plus its own facilities'.
export function buildPrefetchWhere(facilityIds) {
  const facilityScope = facilityIds.length
    ? { [Op.or]: [{ facilityId: null }, { facilityId: { [Op.in]: facilityIds } }] }
    : { facilityId: null };
  return { hash: { [Op.ne]: null }, ...facilityScope };
}

export async function prefetchAssets({ models, transferChannel, blobCache }) {
  if (!transferChannel) return;

  const assets = await models.Asset.findAll({
    where: buildPrefetchWhere(getServerFacilityIds() ?? []),
    attributes: ['hash'],
  });
  // Assets may share content (the same image uploaded under several names), and
  // content addressing collapses those to one blob.
  const hashes = [...new Set(assets.map(({ hash }) => hash))];

  let admitted = 0;
  for (const hash of hashes) {
    try {
      const { existed } = await transferChannel.fetchFromCentral(hash);
      if (!existed) admitted += 1;
    } catch (error) {
      if (error?.type === ERROR_TYPE.NOT_FOUND) {
        // Central doesn't hold the bytes yet — content-pending at the origin,
        // not a transfer fault, so the remaining assets are still worth trying.
        log.debug('prefetchAssets: central does not hold blob yet', { hash });
        continue;
      }
      // A transport fault would make every remaining asset repeat the same
      // retry ladder, adding that cost to the sync cycle for no gain. Give up
      // the pass; the next completed sync retries from the top.
      log.warn('prefetchAssets: abandoning pass after transfer failure', {
        hash,
        error: error.message,
      });
      break;
    }
  }

  if (admitted > 0) {
    // Admissions here bypass the cache's own read-through path, so the budget
    // is enforced once for the pass rather than left to the periodic evictor.
    try {
      await blobCache?.enforceBudget();
    } catch (error) {
      log.warn('prefetchAssets: budget enforcement failed', { error: error.message });
    }
  }
}
