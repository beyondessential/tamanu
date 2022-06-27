import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { NotFoundError } from 'shared/errors';

export const setting = express.Router();

setting.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Setting');

    const {
      models: { Setting },
      query: { names },
    } = req;
    if (!names) {
      res.send([]);
      return;
    }
    const nameArray = names
      .split(/[;,]/)
      .map(n => n.trim())
      .filter(n => n);
    const settings = await Setting.findAll({
      where: {
        settingName: {
          [Op.in]: nameArray,
        },
      },
    });
    const settingMap = settings.reduce((map, stg) => {
      return { ...map, [stg.get('settingName')]: stg.get('settingContent') };
    }, {});
    res.send(settingMap);
  }),
);

setting.get(
  '/:name',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Setting');

    const {
      models: { Setting },
      params: { name },
    } = req;

    const stg = await Setting.findOne({
      where: {
        settingName: name,
      },
    });
    res.send(stg);
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
    const stg = await Setting.findOne({
      where: {
        settingName: name,
      },
    });
    if (!stg) throw new NotFoundError();
    req.checkPermission('write', 'Setting');
    await stg.update(body);
    res.send(stg);
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

    const stg = await Setting.create(body);
    res.send(stg);
  }),
);
