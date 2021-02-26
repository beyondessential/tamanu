import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

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
    res.send(settings);
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
