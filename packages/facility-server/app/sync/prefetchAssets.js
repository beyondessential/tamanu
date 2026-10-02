import { Op } from 'sequelize';

import { ERROR_TYPE } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

import { getServerFacilityIds } from '../serverConfig';

// spec: ASSET
// Asset rows sync everywhere, so scope the fetch to deployment-wide assets plus this server's
// facilities.
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
  const hashes = [...new Set(assets.map(({ hash }) => hash))];

  let admitted = 0;
  for (const hash of hashes) {
    try {
      const { existed } = await transferChannel.fetchFromCentral(hash);
      if (!existed) admitted += 1;
    } catch (error) {
      if (error?.type === ERROR_TYPE.NOT_FOUND) {
        // Content-pending at the origin, so the remaining assets are still worth trying.
        log.debug('prefetchAssets: central does not hold blob yet', { hash });
        continue;
      }
      // A transport fault would repeat the retry ladder for every remaining asset; the next sync
      // retries from the top.
      log.warn('prefetchAssets: abandoning pass after transfer failure', {
        hash,
        error: error.message,
      });
      break;
    }
  }

  if (admitted > 0) {
    // These admissions bypass read-through, so the budget is enforced once for the pass.
    try {
      await blobCache?.enforceBudget();
    } catch (error) {
      log.warn('prefetchAssets: budget enforcement failed', { error: error.message });
    }
  }
}
