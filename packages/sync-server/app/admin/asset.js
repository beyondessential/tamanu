import * as yup from 'yup';
import express from 'express';
import asyncHandler from 'express-async-handler';

import { ASSET_NAMES, ASSET_MIME_TYPES } from 'shared/constants/importable';

export const assetRoutes = express.Router();

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
      await existing.update(record);
      res.send({ action: 'updated', id: existing.id, name, type });
      return;
    }

    const created = await Asset.create(record);
    res.send({ action: 'created', id: created.id, name, type });
  }),
);
