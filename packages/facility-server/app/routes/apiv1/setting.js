import express from 'express';
import asyncHandler from 'express-async-handler';

export const settingRoutes = express.Router();

settingRoutes.get(
  '/setting/:key',
  asyncHandler(async (req, res) => {
    // TODO: not sure what permission to check here
    //req.checkPermission();
    req.flagPermissionChecked();

    const setting = await req.models.Setting.get(req.params.key, null);
    res.send(setting);
  }),
);
