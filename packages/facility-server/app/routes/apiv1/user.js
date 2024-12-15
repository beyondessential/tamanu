import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { BadAuthenticationError } from '@tamanu/shared/errors';
import { getPermissions } from '@tamanu/shared/permissions/middleware';
import {
  paginatedGetList,
  permissionCheckingRouter,
  simpleGet,
} from '@tamanu/shared/utils/crudHelpers';
import {
  getWhereClausesAndReplacementsFromFilters,
  makeDeletedAtIsNullFilter,
  makeFilter,
} from '../../utils/query';
import { isEmpty, mergeWith } from 'lodash';

export const user = express.Router();

user.get(
  '/me',
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new BadAuthenticationError('Invalid token (LLh7)');
    }
    req.checkPermission('read', req.user);
    res.send(req.user);
  }),
);

user.get('/permissions', asyncHandler(getPermissions));

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
      makeDeletedAtIsNullFilter('encounters'),
      makeFilter(true, `user_recently_viewed_patients.user_id = :userId`, () => ({
        userId: currentUser.id,
      })),
    ];

    const { whereClauses, filterReplacements } = getWhereClausesAndReplacementsFromFilters(filters);

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
            AND deleted_at IS NULL
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
  '/userPreferences/:facilityId',
  asyncHandler(async (req, res) => {
    const {
      models: { UserPreference },
      user: currentUser,
      params: { facilityId },
    } = req;

    req.checkPermission('read', currentUser);

    const userPreferencesForFacility = await UserPreference.findOne({
      where: { userId: currentUser.id, facilityId },
    });

    const userPreferencesGeneral = await UserPreference.findOne({
      where: { userId: currentUser.id, facilityId: null },
    });

    const customizer = (objValue, srcValue) => (isEmpty(srcValue) ? objValue : srcValue);

    const combinedPreferences = mergeWith(
      {},
      userPreferencesGeneral,
      userPreferencesForFacility,
      customizer,
    );

    res.send(combinedPreferences);
  }),
);

user.post(
  '/userPreferences',
  asyncHandler(async (req, res) => {
    const {
      models: { UserPreference },
      user: currentUser,
      body: {
        facilityId = null,
        locationBookingFilters,
        outpatientAppointmentFilters,
        selectedGraphedVitalsOnFilter,
      },
    } = req;

    req.checkPermission('write', currentUser);

    const [userPreferences] = await UserPreference.upsert({
      selectedGraphedVitalsOnFilter,
      locationBookingFilters,
      outpatientAppointmentFilters,
      userId: currentUser.id,
      facilityId,
      deletedAt: null,
    });

    res.send(userPreferences);
  }),
);

user.post(
  '/userPreferences/reorderEncounterTab',
  asyncHandler(async (req, res) => {
    const {
      models: { UserPreference },
      user: currentUser,
      body,
    } = req;

    req.checkPermission('write', currentUser);

    const { encounterTabOrders } = body;
    const [userPreferences] = await UserPreference.upsert({
      encounterTabOrders,
      userId: currentUser.id,
      deletedAt: null,
    });

    res.send(userPreferences);
  }),
);

user.get('/:id', simpleGet('User'));

const globalUserRequests = permissionCheckingRouter('list', 'User');
globalUserRequests.get('/$', paginatedGetList('User'));
user.use(globalUserRequests);
