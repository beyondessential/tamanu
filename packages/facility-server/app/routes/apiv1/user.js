import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Op, Sequelize } from 'sequelize';

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
import { TASK_STATUSES, TASK_TYPES } from '@tamanu/constants';
import config from 'config';
import { toCountryDateTimeString } from '@tamanu/shared/utils/countryDateTime';
import { add } from 'date-fns';
import { getOrderClause } from '../../database/utils';

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
    .transform(value => value === 'true')
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
        [Op.and]: [
          {
            [Op.or]: [
              { '$designations.designationUsers.id$': req.user.id }, // get tasks assigned to the current user
              { '$designations.id$': { [Op.is]: null } }, // get tasks that are not assigned to anyone
            ],
          },
          // Filter out medication_due_task where all related MARs are either recorded or paused
          {
            [Op.or]: [
              // Include all non-medication tasks
              { taskType: { [Op.ne]: TASK_TYPES.MEDICATION_DUE_TASK } },
              // For medication_due_task, only include if there's at least one MAR that is NOT recorded AND NOT paused
              {
                [Op.and]: [
                  { taskType: TASK_TYPES.MEDICATION_DUE_TASK },
                  // Check if there exists at least one MAR at the same dueTime that is not recorded and not paused
                  Sequelize.literal(`
                    EXISTS (
                      SELECT 1
                      FROM medication_administration_records mar
                      INNER JOIN prescriptions p ON p.id = mar.prescription_id
                      INNER JOIN encounter_prescriptions ep ON ep.prescription_id = p.id
                      CROSS JOIN LATERAL get_medication_time_slot(mar.due_at::timestamp) AS mar_time_slot
                      WHERE ep.encounter_id = "Task"."encounter_id"
                        AND mar.due_at = "Task"."due_time"
                        AND mar.status IS NULL
                        AND mar.deleted_at IS NULL

                        -- Check if MAR is not currently paused
                        -- A MAR is NOT paused if either:
                        -- 1. Special case applies: next MAR is recorded and not paused, OR
                        -- 2. No pause overlaps with this MAR's time slot
                        AND (
                          -- Special case: if next MAR (in next time slot) is recorded and not paused,
                          -- then current MAR should not be marked as paused regardless of pause overlap
                          -- This matches MarStatus.jsx lines 170-186
                          EXISTS (
                            SELECT 1
                            FROM medication_administration_records next_mar
                            CROSS JOIN LATERAL get_medication_time_slot(next_mar.due_at::timestamp) AS next_mar_time_slot
                            WHERE next_mar.prescription_id = mar.prescription_id
                              AND next_mar.recorded_at IS NOT NULL  -- next MAR is recorded
                              AND next_mar.deleted_at IS NULL
                              -- Next MAR is in the time slot immediately after current MAR
                              AND next_mar_time_slot.start_time = mar_time_slot.end_time
                              -- There exists a pause that would normally affect current MAR but next MAR is not paused
                              AND EXISTS (
                                SELECT 1
                                FROM encounter_pause_prescriptions epp
                                WHERE epp.encounter_prescription_id = ep.id
                                  AND epp.deleted_at IS NULL
                                  -- Pause starts within current slot and ends after current slot
                                  -- This matches the frontend logic in MarStatus.jsx lines 173-175
                                  AND epp.pause_start_date::timestamp >= mar_time_slot.start_time
                                  AND epp.pause_start_date::timestamp < mar_time_slot.end_time
                                  AND epp.pause_end_date::timestamp > mar_time_slot.end_time
                                  -- Check if next MAR would not be paused by this same pause
                                  AND (
                                    -- Check if next MAR is recorded before the pause starts
                                    -- This matches the frontend logic in MarStatus.jsx lines 166-168
                                    next_mar.recorded_at::timestamp <= epp.pause_start_date::timestamp
                                    OR NOT (
                                      -- Check if pause overlaps with the next MAR's time slot
                                      -- A pause overlaps if: pause_start < slot_end AND pause_end >= slot_end
                                      -- This matches the frontend logic in MarStatus.jsx line 188
                                      epp.pause_start_date::timestamp < next_mar_time_slot.end_time
                                      AND epp.pause_end_date::timestamp >= next_mar_time_slot.end_time
                                    )
                                  )
                              )
                          )
                          OR
                          -- Normal case: no pause overlaps with the MAR's time slot
                          NOT EXISTS (
                            SELECT 1
                            FROM encounter_pause_prescriptions epp
                            WHERE epp.encounter_prescription_id = ep.id
                              AND epp.deleted_at IS NULL
                              -- Check if pause overlaps with the MAR's time slot
                              -- A pause overlaps if: pause_start < slot_end AND pause_end >= slot_end
                              -- This matches the frontend logic in MarStatus.jsx line 188
                              AND epp.pause_start_date::timestamp < mar_time_slot.end_time
                              AND epp.pause_end_date::timestamp >= mar_time_slot.end_time
                          )
                        )
                    )
                  `),
                ],
              },
            ],
          },
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
      attributes: ['id', 'dueTime', 'name', 'highPriority', 'status', 'requestTime', 'taskType'],
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
