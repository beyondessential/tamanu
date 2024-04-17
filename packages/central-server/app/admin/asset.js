import * as yup from 'yup';
import express from 'express';
import asyncHandler from 'express-async-handler';

import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { ASSET_MIME_TYPES, ASSET_NAMES } from '@tamanu/constants/importable';

export const assetRoutes = express.Router();

//TODO: Remove when permission check are implemented in all central server routes
assetRoutes.use(ensurePermissionCheck);

const assetSchema = yup.object().shape({
  name: yup
    .string()
    .oneOf(Object.values(ASSET_NAMES))
    .required(),
  type: yup
    .string()
    .oneOf(Object.values(ASSET_MIME_TYPES))
    .required(),
  data: yup.string().required(),
});

assetRoutes.put(
  '/:name',
  asyncHandler(async (req, res) => {
    const { params, body } = req;
    const { name } = params;

    const ext = (body.filename || '').split('.').slice(-1);
    const type = ASSET_MIME_TYPES[ext] || 'unknown';
    const data = Buffer.from(body.data, 'base64');

    const record = {
      name,
      data,
      type,
    };
    await assetSchema.validate(record);

    const { Asset } = req.store.models;
    const existing = await Asset.findOne({ where: { name } });

    if (existing) {
      req.checkPermission('write', existing);
      await existing.update(record);
      res.send({ action: 'updated', id: existing.id, name, type });
      return;
    }

    req.checkPermission('create', 'Asset');

    const created = await Asset.create(record);
    res.send({ action: 'created', id: created.id, name, type });
  }),
);
