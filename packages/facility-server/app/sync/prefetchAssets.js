import { Op } from 'sequelize';

import { log } from '@tamanu/shared/services/logging';

// spec: ASSET
// Fetch each asset's bytes as its row arrives through sync, so a certificate or
// patient letter prints without depending on connectivity at print time. Asset
// rows are few and pull-only, so a full pass after each completed sync is cheap;
// fetchFromCentral is idempotent and skips content already held.
export async function prefetchAssets({ models, transferChannel }) {
  if (!transferChannel) return;
  const assets = await models.Asset.findAll({
    where: { hash: { [Op.ne]: null } },
    attributes: ['hash'],
  });
  for (const { hash } of assets) {
    try {
      await transferChannel.fetchFromCentral(hash);
    } catch (error) {
      log.warn('prefetchAssets: fetch failed', { hash, error: error.message });
    }
  }
}
