import express from 'express';
import asyncHandler from 'express-async-handler';

export const userPreferencesRouter = express.Router();

// GET /admin/user/userPreferences/:facilityId
userPreferencesRouter.get(
  '/userPreferences/:facilityId',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { UserPreference },
      },
      user: currentUser,
      params: { facilityId },
    } = req;

    req.checkPermission('read', currentUser);

    const userPreferences = await UserPreference.getAllPreferences(currentUser.id, facilityId);
    res.send(userPreferences || {});
  }),
);

// POST /admin/user/userPreferences
userPreferencesRouter.post(
  '/userPreferences',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { UserPreference },
      },
      user: currentUser,
      body: { facilityId = null, key, value },
    } = req;

    req.checkPermission('write', currentUser);

    const [userPreferences] = await UserPreference.upsert({
      key,
      value,
      userId: currentUser.id,
      facilityId,
      deletedAt: null,
    });

    res.send(userPreferences);
  }),
);


