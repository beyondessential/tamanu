import * as yup from 'yup';
import express from 'express';
import asyncHandler from 'express-async-handler';

export const assetRoutes = express.Router();

const ASSETS = {
  LETTERHEAD_LOGO: 'letterhead-logo',

  VACCINE_CERTIFICATE_WATERMARK: 'vaccine-certificate-watermark',
  CERTIFICATE_BOTTOM_HALF_IMG: 'certificate-bottom-half-img',
  DEATH_CERTIFICATE_BOTTOM_HALF_IMG: 'death-certificate-bottom-half-img',
};
export const ASSET_NAMES = Object.values(ASSETS);

const MIME_TYPES = [
  'image/png',
  'image/svg',
];

const assetSchema = yup.object().shape({
  name: yup.string().oneOf(ASSET_NAMES).required(),
  type: yup.string().oneOf(MIME_TYPES).required(),
  data: yup.string().required(),
});

assetRoutes.get('/$', (req, res) => {
  res.send(ASSET_NAMES);
});

assetRoutes.put('/:name', asyncHandler(async (req, res) => {
  const { params, body } = req;
  const { name } = params;
  
  const data = Buffer.from(body.data, 'base64');

  const record = {
    name,
    data,
    type: body.type,
  };
  await assetSchema.validate(record);

  const { Asset } = req.store.models;
  const existing = await Asset.findOne({ where: { name } });

  if (existing) {
    await existing.update(record);
    res.send({ action: 'updated', id: existing.id });
    return;
  } 
  
  const created = await Asset.create(record);
  res.send({ action: 'created', id: created.id });
}));
