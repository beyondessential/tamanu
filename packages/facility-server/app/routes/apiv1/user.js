import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Op, Sequelize } from 'sequelize';
import bcrypt from 'bcrypt';
import * as yup from 'yup';
import { ValidationError } from 'yup';

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
import { getOrderClause } from '../../database/utils';
import { log } from '@tamanu/shared/services/logging';

export const user = express.Router();

const validatePasswordStrength = (password) => {
  if (!password) return false;
  
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;
  
  return hasLower && hasUpper && hasNumber && hasSpecial && isLongEnough;
};

const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required')
    .test('password-strength', 'Password must contain uppercase, lowercase, number, and special character', validatePasswordStrength),
  confirmPassword: yup
    .string()
    .required('Password confirmation is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

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

user.post(
  '/change-password',
  asyncHandler(async (req, res) => {
    const { models, body, user: currentUser } = req;

    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.checkPermission('write', currentUser);

    await changePasswordSchema.validate(body);

    const { currentPassword, newPassword } = body;

    // Get user with password to verify current password
    const userWithPassword = await models.User.scope('withPassword').findByPk(currentUser.id);
    
    if (!userWithPassword) {
      throw new ValidationError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
    
    if (!isCurrentPasswordValid) {
      log.warn('changePasswordAuthenticated.invalidCurrentPassword', { userId: currentUser.id });
      throw new ValidationError('Current password is incorrect');
    }

    // Update password (User model will handle hashing via beforeUpdate hook)
    await models.User.update(
      { password: newPassword },
      { where: { id: currentUser.id } }
    );

    log.info('changePasswordAuthenticated.success', { userId: currentUser.id });
    res.send({ success: true });
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
      makeFilter(true, `patients.merged_into_id IS NULL`),
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
        patients.date_of_death,
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

    const userPreferences = await UserPreference.getAllPreferences(currentUser.id, facilityId);

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

const clinicianTasksQuerySchema = z.object({
  orderBy: z
    .enum(['dueTime', 'location', 'patientName', 'encounter.patient.displayId', 'name'])
    .optional()
    .default('dueTime'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  designationId: z.string().optional(),
  locationGroupId: z.string().optional(),
  locationId: z.string().array().optional(),
  highPriority: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional()
    .default('false'),
  page: z.coerce.number().optional().default(0),
  rowsPerPage: z.coerce.number().max(50).min(10).optional().default(25),
  facilityId: z.string(),
});
user.get(
  '/tasks',
  asyncHandler(async (req, res) => {
    const { models } = req;
    req.checkPermission('read', 'Tasking');

    const query = await clinicianTasksQuerySchema.parseAsync(req.query);
    const {
      orderBy,
      order,
      page,
      rowsPerPage,
      highPriority,
      locationId,
      locationGroupId,
      designationId,
      facilityId,
    } = query;

    const upcomingTasksTimeFrame = config.tasking?.upcomingTasksTimeFrame || 8;

    const defaultOrder = [
      ['dueTime', 'ASC'],
      ['highPriority', 'DESC'],
      [
        Sequelize.literal(
          'LOWER(CONCAT("encounter->patient"."first_name", \' \', "encounter->patient"."last_name"))',
        ),
      ],
      ['name', 'ASC'],
    ];
    const orderOptions = [];
    if (orderBy) {
      switch (orderBy) {
        case 'location':
          orderOptions.push([
            Sequelize.literal(
              'LOWER(CONCAT("encounter->location->locationGroup"."name", \' \', "encounter->location"."name"))',
            ),
            order,
          ]);
          break;
        case 'patientName':
          orderOptions.push([
            Sequelize.literal(
              'LOWER(CONCAT("encounter->patient"."first_name", \' \', "encounter->patient"."last_name"))',
            ),
            order,
          ]);
          break;
        default:
          orderOptions.push(getOrderClause(order, orderBy));
      }
    }

    const baseQueryOptions = {
      where: {
        '$encounter->location.facility_id$': facilityId,
        status: TASK_STATUSES.TODO,
        dueTime: {
          [Op.lte]: toCountryDateTimeString(add(new Date(), { hours: upcomingTasksTimeFrame })),
        },
        ...(highPriority && { highPriority }),
        [Op.or]: [
          { '$designations.designationUsers.id$': req.user.id }, // get tasks assigned to the current user
          { '$designations.id$': { [Op.is]: null } }, // get tasks that are not assigned to anyone
        ],
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
              ...(locationId && { where: { id: locationId } }),
              include: [
                {
                  model: models.LocationGroup,
                  as: 'locationGroup',
                  ...(locationGroupId && { where: { id: locationGroupId } }),
                },
              ],
            },
          ],
        },
        {
          attributes: [],
          model: models.ReferenceData,
          as: 'designations',
          ...(designationId && { where: { id: designationId } }),
          required: false,
          include: [
            {
              attributes: [],
              model: models.User,
              as: 'designationUsers',
            },
          ],
        },
      ],
      order: [...orderOptions, ...defaultOrder],
    };

    const tasks = await models.Task.findAll({
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      attributes: ['id', 'dueTime', 'name', 'highPriority', 'status', 'requestTime'],
      subQuery: false,
      ...baseQueryOptions,
    });

    const count = await models.Task.count(baseQueryOptions);
    res.send({ data: tasks, count });
  }),
);

user.get('/:id', simpleGet('User'));

const globalUserRequests = permissionCheckingRouter('list', 'User');
globalUserRequests.get('/$', paginatedGetList('User'));
user.use(globalUserRequests);
