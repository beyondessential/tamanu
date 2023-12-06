import express from 'express';

export const versionRouter = express.Router();

const appVersions = {
  desktop: '0.0.1',
  mobile: '0.0.1',
  lan: '0.0.1',
};

['desktop', 'mobile', 'lan'].forEach(appType => {
  versionRouter.get(`/${appType}`, (_req, res) => {
    res.send({
      appType,
      version: appVersions[appType],
    });
  });
});
