import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Op, Sequelize } from 'sequelize';

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
import { TASK_STATUSES, TASK_TYPES, USER_KINDS } from '@tamanu/constants';
import { toPrimaryDateTimeString } from '@tamanu/shared/utils/primaryDateTime';
import { add, sub } from 'date-fns';
import { getOrderClause } from '../../database/utils';
import { ForbiddenError } from '@tamanu/errors';
import { dateCustomValidation } from '@tamanu/utils/dateTime';

export const user = express.Router();

user.get(
  '/me',
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('authentication required');
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
      makeFilter(
        query.encounterType,
        'encounters.encounter_type IN (:encounterTypes)',
        () => ({
          encounterTypes: Array.isArray(query.encounterType)
            ? query.encounterType
            : [query.encounterType],
        }),
      ),
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

const checkOnLeaveSchema = z.object({
  startDate: dateCustomValidation,
  endDate: dateCustomValidation,
});

user.post(
  '/:userId/check-on-leave',
  asyncHandler(async (req, res) => {
    const {
      models: { UserLeave },
      params,
      body,
    } = req;

    const { userId } = params;
    const { startDate, endDate } = await checkOnLeaveSchema.parseAsync(body);

    req.checkPermission('read', 'User');

    const leave = await UserLeave.findOne({
      where: {
        userId,
        startDate: {
          [Op.lte]: endDate,
        },
        endDate: {
          [Op.gte]: startDate,
        },
      },
    });

    res.send({ isOnLeave: !!leave });
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
    .optional()
    .default('false')
    .transform(value => value === 'true'),
  page: z.coerce.number().optional().default(0),
  rowsPerPage: z.coerce.number().max(50).min(10).optional().default(25),
  facilityId: z.string(),
});
user.get(
  '/tasks',
  asyncHandler(async (req, res) => {
    const { models, settings } = req;
    req.checkPermission('read', 'Tasking');

    const hasMedicationPermission = req.ability.can('list', 'MedicationAdministration');

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

    const upcomingTasksTimeFrame = await settings[req.facilityId]?.get(
      'tasking.upcomingTasksTimeFrame',
    );
    const overdueTasksTimeFrame = await settings[req.facilityId]?.get(
      'tasking.dashboardOverdueTasksTimeFrame',
    );

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

    // The designation filters are pure predicates — the include selected no attributes — but
    // as a belongsToMany chain (tasks -> task_designations -> reference_data ->
    // user_designations -> users) they multiplied rows, and with subQuery: false the LIMIT
    // applies to joined rows. One task with three designations of five users each consumed
    // fifteen slots of a twenty-five row page, so a page could show a handful of tasks while
    // reporting a much larger total. As EXISTS predicates they leave one row per task, which
    // makes both the page and the count mean what they say. The per-encounter tasks route
    // already filters designations this way.
    const scopedToDesignation = designationId
      ? 'AND task_designations.designation_id = :designationId'
      : '';
    // Note: when designationId is set, the second branch admits tasks carrying no designation
    // *matching that filter* — including tasks designated to some other designation. That is
    // the existing behaviour of the LEFT JOIN this replaces, preserved deliberately.
    const assignedToUserOrUnassigned = Sequelize.literal(`(
      EXISTS (
        SELECT 1
        FROM task_designations
        INNER JOIN reference_data AS designation
          ON designation.id = task_designations.designation_id
          AND designation.deleted_at IS NULL
        INNER JOIN user_designations
          ON user_designations.designation_id = designation.id
          AND user_designations.deleted_at IS NULL
        INNER JOIN users AS designation_user
          ON designation_user.id = user_designations.user_id
          AND designation_user.deleted_at IS NULL
        WHERE task_designations.task_id = "Task"."id"
          AND task_designations.deleted_at IS NULL
          AND designation_user.id = :designationUserId
          ${scopedToDesignation}
      )
      OR NOT EXISTS (
        SELECT 1
        FROM task_designations
        INNER JOIN reference_data AS designation
          ON designation.id = task_designations.designation_id
          AND designation.deleted_at IS NULL
        WHERE task_designations.task_id = "Task"."id"
          AND task_designations.deleted_at IS NULL
          ${scopedToDesignation}
      )
    )`);

    const baseQueryOptions = {
      replacements: {
        designationUserId: req.user.id,
        ...(designationId && { designationId }),
      },
      where: {
        '$encounter->location.facility_id$': facilityId,
        status: TASK_STATUSES.TODO,
        dueTime: {
          [Op.lte]: toPrimaryDateTimeString(add(new Date(), { hours: upcomingTasksTimeFrame })),
          // The floor bounds the (status, due_time) index scan; without it the
          // scan starts at the beginning of time and grows with the site's
          // backlog of never-actioned tasks.
          ...(overdueTasksTimeFrame != null && {
            [Op.gte]: toPrimaryDateTimeString(sub(new Date(), { hours: overdueTasksTimeFrame })),
          }),
        },
        ...(highPriority && { highPriority }),
        [Op.and]: [
          assignedToUserOrUnassigned,
          // Filter out medication_due_task where all related MARs are either recorded or paused
          {
            [Op.or]: [
              // Include all non-medication tasks
              { taskType: { [Op.ne]: TASK_TYPES.MEDICATION_DUE_TASK } },
              // For medication_due_task, only include if user has medication permissions AND there's at least one MAR that is NOT recorded AND NOT paused
              ...(hasMedicationPermission ? [{ 
                [Op.and]: [
                  { taskType: TASK_TYPES.MEDICATION_DUE_TASK },
                  // Check if there exists at least one MAR at the same dueTime that is not recorded and not paused.
                  // Driven from encounter_prescriptions filtered by encounter_id (few rows for this
                  // encounter) rather than from medication_administration_records by due_at (every MAR at
                  // that time across all patients), so the MAR probe uses its
                  // (prescription_id, due_at, status) index instead of a global scan. prescriptions is only
                  // a bridge between mar.prescription_id and ep.prescription_id, so it is joined directly.
                  Sequelize.literal(`
                    EXISTS (
                      SELECT 1
                      FROM encounter_prescriptions ep
                      INNER JOIN medication_administration_records mar
                        ON mar.prescription_id = ep.prescription_id
                        AND mar.due_at = "Task"."due_time"
                        AND mar.status IS NULL
                        AND mar.deleted_at IS NULL
                      CROSS JOIN LATERAL get_medication_time_slot(mar.due_at::timestamp) AS mar_time_slot
                      WHERE ep.encounter_id = "Task"."encounter_id"

                        -- Check if MAR is not currently paused
                        AND NOT EXISTS (
                          SELECT 1
                          FROM encounter_pause_prescriptions epp
                          WHERE epp.encounter_prescription_id = ep.id
                            AND epp.deleted_at IS NULL
                            -- Check if pause overlaps with the MAR's time slot
                            -- A pause overlaps if: pause_start < slot_end AND pause_end >= slot_end
                            -- This matches the frontend logic in MarStatus.jsx line 169
                            AND epp.pause_start_date::timestamp < mar_time_slot.end_time
                            AND epp.pause_end_date::timestamp >= mar_time_slot.end_time
                        )
                    )
                  `),
                ],
              }] : []),
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

    // Counting repeats every predicate above, including the correlated MAR probe, over the
    // whole match set with no LIMIT — the expensive half of this endpoint. Now that a task
    // occupies exactly one row, a short *non-empty* page is the last one, so the total
    // follows from the offset and needs no second pass.
    //
    // A short page that is also empty proves nothing: the offset may have run past a total
    // that shrank since the client read it (tasks leave TODO constantly here), and deriving
    // the total from the offset would invent one. Only page 0 is safe there, where an empty
    // page means an empty result — and the same expression gives 0 for it.
    const isLastPage = tasks.length > 0 && tasks.length < rowsPerPage;
    const isEmptyFirstPage = page === 0 && tasks.length === 0;
    const count =
      isLastPage || isEmptyFirstPage
        ? page * rowsPerPage + tasks.length
        : await models.Task.count(baseQueryOptions);
    res.send({ data: tasks, count });
  }),
);

user.get('/:id', simpleGet('User'));

const globalUserRequests = permissionCheckingRouter('list', 'User');
globalUserRequests.get(
  '/',
  paginatedGetList('User', '', {
    // Only human users are clinicians; machine accounts (sync, system) opt out by kind
    additionalFilters: { kind: USER_KINDS.USER },
  }),
);
user.use(globalUserRequests);
