import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { DELETION_STATUSES } from '@tamanu/constants';
import { BadAuthenticationError } from 'shared/errors';
import { getPermissions } from 'shared/permissions/middleware';
import { simpleGet, paginatedGetList, permissionCheckingRouter } from 'shared/utils/crudHelpers';
import { getWhereClausesAndReplacementsFromFilters, makeFilter } from '../../utils/query';

export const user = express.Router();

user.get(
  '/me',
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new BadAuthenticationError('Invalid token');
    }
    req.checkPermission('read', req.user);
    res.send(req.user);
  }),
);

user.get('/permissions', asyncHandler(getPermissions));

user.get(
  '/current-facility',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'User');
    const userFacilities = await req.models.UserFacility.findAll({
      where: { facilityId: config.serverFacilityId },
      include: [
        {
          model: req.models.User,
          as: 'user',
        },
      ],
    });
    const users = userFacilities.map(userFacility => userFacility.get({ plain: true }).user);
    res.send(users);
  }),
);

user.get(
  '/recently-viewed-patients',
  asyncHandler(async (req, res) => {
    const {
      models: { Patient },
      user: currentUser,
      query,
    } = req;

    req.checkPermission('read', currentUser);
    req.checkPermission('list', 'Patient');

    const filters = [
      makeFilter(query.encounterType, 'encounters.encounter_type = :encounterType', () => ({
        encounterType: query.encounterType,
      })),
      makeFilter(true, `encounters.deletion_status = :deletionStatus`, () => ({
        deletionStatus: DELETION_STATUSES.CURRENT,
      })),
      makeFilter(true, `user_recently_viewed_patients.user_id = :userId`, () => ({
        userId: currentUser.id,
      })),
    ];

    const { whereClauses, filterReplacements } = getWhereClausesAndReplacementsFromFilters(
      filters,
      {
        deletionStatus: DELETION_STATUSES.CURRENT,
      },
    );

    const recentlyViewedPatients = await req.db.query(
      `
      SELECT
        patients.id,
        patients.display_id,
        patients.first_name,
        patients.last_name,
        patients.sex,
        patients.date_of_birth,
        encounters.id AS encounter_id,
        encounters.encounter_type,
        user_recently_viewed_patients.updated_at AS last_accessed_on
      FROM user_recently_viewed_patients
        LEFT JOIN patients
          ON (patients.id = user_recently_viewed_patients.patient_id)
        LEFT JOIN (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY start_date DESC, id DESC) AS row_num
            FROM encounters
            WHERE end_date IS NULL
            AND deletion_status = :deletionStatus
            ) encounters
            ON (patients.id = encounters.patient_id AND encounters.row_num = 1)
        ${whereClauses && `WHERE ${whereClauses}`}
        ORDER BY last_accessed_on DESC
        LIMIT 12
      `,
      {
        model: Patient,
        type: QueryTypes.SELECT,
        mapToModel: true,
        replacements: filterReplacements,
      },
    );

    res.send({
      data: recentlyViewedPatients,
      count: recentlyViewedPatients.length,
    });
  }),
);

user.post(
  '/recently-viewed-patients/:patientId',
  asyncHandler(async (req, res) => {
    const {
      models: { UserRecentlyViewedPatient },
      user: currentUser,
      params,
    } = req;

    const { patientId } = params;

    req.checkPermission('read', 'Patient');

    const [createdRelation] = await UserRecentlyViewedPatient.create({
      userId: currentUser.id,
      patientId,
    });

    res.send(createdRelation);
  }),
);

user.get(
  '/userPreferences',
  asyncHandler(async (req, res) => {
    const {
      models: { UserPreference },
      user: currentUser,
    } = req;

    req.checkPermission('read', currentUser);

    const userPreferences = await UserPreference.findOne({
      where: { userId: currentUser.id },
    });

    // Return {} as default if no user preferences exist
    res.send(userPreferences || {});
  }),
);

user.post(
  '/userPreferences',
  asyncHandler(async (req, res) => {
    const {
      models: { UserPreference },
      user: currentUser,
      body,
    } = req;

    req.checkPermission('write', currentUser);

    const { selectedGraphedVitalsOnFilter } = body;
    const [userPreferences] = await UserPreference.upsert({
      selectedGraphedVitalsOnFilter,
      userId: currentUser.id,
    });

    res.send(userPreferences);
  }),
);

user.get('/:id', simpleGet('User'));

const globalUserRequests = permissionCheckingRouter('list', 'User');
globalUserRequests.get('/$', paginatedGetList('User'));
user.use(globalUserRequests);
