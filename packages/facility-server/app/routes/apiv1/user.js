import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Op } from 'sequelize';

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
import { z } from 'zod';
import { TASK_STATUSES } from '@tamanu/constants';
import config from 'config';
import { toCountryDateTimeString } from '@tamanu/shared/utils/countryDateTime';
import { add } from 'date-fns';

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

    const { selectedGraphedVitalsOnFilter, clinicianDashboardTaskingTableFilter } = body;
    const [userPreferences] = await UserPreference.upsert({
      selectedGraphedVitalsOnFilter,
      clinicianDashboardTaskingTableFilter,
      userId: currentUser.id,
      deletedAt: null,
    });

    res.send(userPreferences);
  }),
);

user.get('/:id', simpleGet('User'));

const clinicianTasksQuerySchema = z.object({
  orderBy: z
    .tuple([z.enum(['dueTime', 'name']), z.enum(['ASC', 'DESC'])])
    .optional()
    .default(['dueTime', 'ASC']),
  designationId: z.string().optional(),
  locationGroupId: z.string().optional(),
  locationId: z.string().optional(),
  highPriority: z
    .enum(['true', 'false'])
    .transform(value => value === 'true')
    .optional()
    .default('false'),
  page: z.coerce
    .number()
    .optional()
    .default(0),
  rowsPerPage: z.coerce
    .number()
    .max(50)
    .min(10)
    .optional()
    .default(25),
});
user.get(
  '/:id/tasks',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'Task');
    const { id: userId } = params;

    const query = await clinicianTasksQuerySchema.parseAsync(req.query);

    const upcomingTasksTimeFrame = config.tasking?.upcomingTasksTimeFrame || 8;

    const baseQueryOptions = {
      where: {
        status: TASK_STATUSES.TODO,
        dueTime: {
          [Op.lte]: toCountryDateTimeString(add(new Date(), { hours: upcomingTasksTimeFrame })),
        },
        ...(query.highPriority && { highPriority: query.highPriority }),
      },
      include: [
        'requestedBy',
        {
          model: models.Encounter,
          as: 'encounter',
          where: { endDate: { [Op.is]: null } }, // only get tasks belong to active encounters
          include: [
            'patient',
            {
              model: models.Location,
              as: 'location',
              ...(query.locationId && { where: { id: query.locationId } }),
              include: [
                {
                  model: models.LocationGroup,
                  as: 'locationGroup',
                  ...(query.locationGroupId && { where: { id: query.locationGroupId } }),
                },
              ],
            },
          ],
        },
        {
          attributes: [],
          model: models.ReferenceData,
          as: 'designations',
          ...(query.designationId && { where: { id: query.designationId } }),
          required: true,
          include: [
            {
              attributes: [],
              model: models.User,
              as: 'designationUsers',
              where: { id: userId }, // only get tasks assigned to the current user
            },
          ],
        },
      ],
    };

    const tasks = await models.Task.findAll({
      order: [query.orderBy, ['highPriority', 'DESC'], ['name', 'ASC']],
      limit: query.rowsPerPage,
      offset: query.page * query.rowsPerPage,
      attributes: ['id', 'dueTime', 'name', 'highPriority', 'status', 'requestTime'],
      ...baseQueryOptions,
    });

    const count = await models.Task.count(baseQueryOptions);
    res.send({ data: tasks, count });
  }),
);

const globalUserRequests = permissionCheckingRouter('list', 'User');
globalUserRequests.get('/$', paginatedGetList('User'));
user.use(globalUserRequests);
