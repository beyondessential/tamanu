import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';
import { NotFoundError } from '@tamanu/errors';
import { resolveAssetImageData } from '@tamanu/shared/utils/assets';

export const asset = express.Router();

asset.get(
  '/:name',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();

    const {
      models: { Asset },
      blobCache,
      params: { name },
      query: { facilityId },
    } = req;

    const assetRecord = await Asset.findOne({
      where: {
        name,
        facilityId: { [Op.or]: [facilityId, null] },
      },
      order: [['facilityId', 'ASC NULLS LAST']],
    });

    // spec: ASSET
    // The bytes are returned inline whichever form the row takes, so the web
    // client needs no awareness of where they live. A hash row is read through
    // the cache, fetching from central on a miss; a legacy row carries its own
    // bytes. No row at all stays an empty response (the asset is optional).
    if (!assetRecord?.hash) {
      res.send(assetRecord || {});
      return;
    }

    try {
      const data = await resolveAssetImageData(assetRecord, hash => blobCache.open(hash));
      res.send({ ...assetRecord.get({ plain: true }), data });
    } catch (error) {
      if (error instanceof NotFoundError) {
        // spec: ASSET — the row exists but its bytes are not yet available;
        // surface content-pending rather than presenting the asset as absent.
        res.send({
          ...assetRecord.get({ plain: true }),
          data: null,
          availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH,
        });
        return;
      }
      throw error;
    }
  }),
);
