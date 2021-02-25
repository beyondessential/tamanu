import express from 'express';
import asyncHandler from 'express-async-handler';

export const setting = express.Router();

setting.get(
  '/:name',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Setting');

    const {
      models: { Setting },
      params: { name },
    } = req;

    const setting = await Setting.findOne({
      where: {
        settingName: name,
      },
    });
    res.send(setting);
  }),
);

setting.put(
  '/:name',
  asyncHandler(async (req, res) => {
    const {
      models: { Setting },
      params: { name },
      body,
    } = req;

    req.checkPermission('read', 'Setting');
    const setting = await Setting.findOne({
      where: {
        settingName: name,
      },
    });
    if (!setting) throw new NotFoundError();
    req.checkPermission('write', 'Setting');
    await setting.update(body);
    res.send(setting);
  }),
);

setting.post(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Setting');

    const {
      models: { Setting },
      body,
    } = req;

    const setting = await Setting.create(body);
    res.send(setting);
  }),
);
