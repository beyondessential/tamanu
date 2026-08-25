import express from 'express';
import asyncHandler from 'express-async-handler';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { Op, QueryTypes, Sequelize } from 'sequelize';

import { InvalidOperationError, NotFoundError } from '@tamanu/errors';
import { getDayBoundaries } from '@tamanu/utils/dateTime';
import {
  LAB_REQUEST_STATUSES,
  LAB_TEST_TYPE_VISIBILITY_STATUSES,
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { keyBy } from 'es-toolkit/compat';
import { renameObjectKeys } from '@tamanu/utils/renameObjectKeys';
import {
  permissionCheckingRouter,
  simpleGet,
  simpleGetList,
  findRouteObject,
} from '@tamanu/shared/utils/crudHelpers';
import {
  getWhereClausesAndReplacementsFromFilters,
  makeDeletedAtIsNullFilter,
  makeFilter,
  makeSimpleTextFilterFactory,
  makeSubstringTextFilterFactory,
} from '../../utils/query';
import { notesWithSingleItemListHandler } from '../../routeHandlers';

export const labRequest = express.Router();

labRequest.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const labRequestRecord = await findRouteObject(req, 'LabRequest');
    const hasSensitiveTests = labRequestRecord.tests.some(test => test.labTestType.isSensitive);
    if (hasSensitiveTests) {
      req.checkPermission('read', 'SensitiveLabRequest');
    }

    const { LabRequest } = req.models;

    await req.audit.access({
      recordId: labRequestRecord.id,
      frontEndContext: req.params,
      model: LabRequest,
    });

    const latestAttachment = await labRequestRecord.getLatestAttachment();
    res.send({
      ...labRequestRecord.forResponse(),
      latestAttachment,
    });
  }),
);

labRequest.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params, db, settings, facilityId } = req;
    const { userId, ...labRequestData } = req.body;
    req.checkPermission('read', 'LabRequest');
    const labRequestRecord = await models.LabRequest.findByPk(params.id, {
      include: [{ association: 'tests', include: ['labTestType'] }],
    });
    if (!labRequestRecord) throw new NotFoundError();
    req.checkPermission('write', labRequestRecord);

    if (labRequestData.status && labRequestData.status !== labRequestRecord.status) {
      req.checkPermission('write', 'LabRequestStatus');
    }

    const priorityEditable =
      (await settings[facilityId]?.get('features.labRequest.priorityEditable')) ?? true;

    if (
      !priorityEditable &&
      labRequestData.labTestPriorityId !== undefined &&
      labRequestData.labTestPriorityId !== labRequestRecord.labTestPriorityId
    ) {
      throw new InvalidOperationError('Lab request priority cannot be changed.');
    }

    const hasSensitiveTests = labRequestRecord.tests.some(test => test.labTestType.isSensitive);
    if (hasSensitiveTests) {
      req.checkPermission('write', 'SensitiveLabRequest');
    }

    await db.transaction(async () => {
      if (labRequestData.status && labRequestData.status !== labRequestRecord.status) {
        if (!userId) throw new InvalidOperationError('No user found for LabRequest status change.');
        await models.LabRequestLog.create({
          status: labRequestData.status,
          labRequestId: params.id,
          updatedById: userId,
        });
      }

      if (labRequestData.specimenTypeId !== undefined) {
        labRequestData.specimenAttached = !!labRequestData.specimenTypeId;
      }
      await labRequestRecord.update(labRequestData);
    });

    res.send(labRequestRecord);
  }),
);

labRequest.post(
  '/',
  asyncHandler(async (req, res) => {
    const { models, body, user } = req;
    const { panelIds, labTestTypeIds = [], note } = body;
    req.checkPermission('create', 'LabRequest');

    if (!panelIds?.length && !labTestTypeIds?.length) {
      throw new InvalidOperationError('A lab request must have at least one test or panel');
    }

    const hasSensitiveTestType = await models.LabTestType.findOne({
      where: { id: labTestTypeIds, isSensitive: true },
    });

    // Panel requests resolve their test types server-side (see createPanelLabRequests), so the
    // supplied labTestTypeIds don't cover them. Check the panels' tests for sensitivity too,
    // otherwise a panel containing a sensitive test would bypass the SensitiveLabRequest check.
    let panelHasSensitiveTestType = false;
    if (panelIds?.length) {
      const panels = await models.LabTestPanel.findAll({
        where: { id: panelIds },
        include: [{ model: models.LabTestType, as: 'labTestTypes', attributes: ['isSensitive'] }],
      });
      panelHasSensitiveTestType = panels.some(panel =>
        panel.labTestTypes?.some(testType => testType.isSensitive),
      );
    }

    if (hasSensitiveTestType || panelHasSensitiveTestType) {
      req.checkPermission('create', 'SensitiveLabRequest');
    }

    const response = await createLabRequestsByCategory(models, body, note, user);

    res.send(response);
  }),
);

labRequest.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      models: { LabRequest, LabTestType },
      query,
      settings,
    } = req;
    req.checkPermission('list', 'LabRequest');
    const canListSensitive = req.ability.can('list', 'SensitiveLabRequest');
    // With no sensitive test types (most deployments) the anti-join below is vacuous, so skip
    // it. paranoid: false mirrors the raw filter, which doesn't exclude soft-deleted types.
    const mustExcludeSensitive =
      !canListSensitive &&
      (await LabTestType.findOne({
        where: { isSensitive: true },
        attributes: ['id'],
        paranoid: false,
      })) !== null;

    const {
      order = 'ASC',
      orderBy = 'displayId',
      rowsPerPage = 10,
      page = 0,
      ...filterParams
    } = query;

    const primaryTimeZone = getPrimaryTimeZone();
    const { facilityId } = filterParams;
    const facilityTimeZone = await settings[facilityId]?.get('facilityTimeZone');

    const makeSimpleTextFilter = makeSimpleTextFilterFactory(filterParams);
    const makePartialTextFilter = makeSubstringTextFilterFactory(filterParams);
    const filters = [
      makeFilter(true, `lab_requests.status != :deleted`, () => ({
        deleted: LAB_REQUEST_STATUSES.DELETED,
      })),
      makeFilter(true, `lab_requests.status != :cancelled`, () => ({
        cancelled: LAB_REQUEST_STATUSES.CANCELLED,
      })),
      makeFilter(
        !filterParams.statuses?.includes(LAB_REQUEST_STATUSES.INVALIDATED),
        `lab_requests.status != :invalidated`,
        () => ({
          invalidated: LAB_REQUEST_STATUSES.INVALIDATED,
        }),
      ),
      makeFilter(
        !filterParams.statuses?.includes(LAB_REQUEST_STATUSES.PUBLISHED),
        'lab_requests.status != :published',
        () => ({
          published: LAB_REQUEST_STATUSES.PUBLISHED,
        }),
      ),
      makeDeletedAtIsNullFilter('lab_requests'),
      makeFilter(true, `lab_requests.status != :enteredInError`, () => ({
        enteredInError: LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
      })),
      makeFilter(filterParams.statuses, 'lab_requests.status in (:statuses)'),
      makeSimpleTextFilter('requestId', 'lab_requests.display_id'),
      makeFilter(filterParams.category, 'category.id = :category'),
      makeSimpleTextFilter('priority', 'priority.id'),
      makeFilter(filterParams.laboratory, 'lab_requests.lab_test_laboratory_id = :laboratory'),
      makePartialTextFilter('displayId', 'patient.display_id'),
      makeSimpleTextFilter('firstName', 'patient.first_name'),
      makeSimpleTextFilter('lastName', 'patient.last_name'),
      makeSimpleTextFilter('patientId', 'patient.id'),
      makeFilter(filterParams.requestedById, 'lab_requests.requested_by_id = :requestedById'),
      makeFilter(filterParams.departmentId, 'lab_requests.department_id = :departmentId'),
      makeFilter(filterParams.locationGroupId, 'location.location_group_id = :locationGroupId'),
      makeFilter(
        filterParams.labTestPanelId,
        `EXISTS (
          SELECT 1 FROM lab_test_panel_requests ltpr_filter
          WHERE ltpr_filter.lab_request_id = lab_requests.id
            AND ltpr_filter.lab_test_panel_id = :labTestPanelId
        )`,
        () => ({ labTestPanelId: filterParams.labTestPanelId }),
      ),
      makeFilter(
        filterParams.requestedDateFrom,
        'lab_requests.requested_date >= :requestedDateFrom',
        ({ requestedDateFrom }) => {
          const boundaries = getDayBoundaries(requestedDateFrom, primaryTimeZone, facilityTimeZone);
          return { requestedDateFrom: boundaries?.start ?? `${requestedDateFrom} 00:00:00` };
        },
      ),
      makeFilter(
        filterParams.requestedDateTo,
        'lab_requests.requested_date <= :requestedDateTo',
        ({ requestedDateTo }) => {
          const boundaries = getDayBoundaries(requestedDateTo, primaryTimeZone, facilityTimeZone);
          return { requestedDateTo: boundaries?.end ?? `${requestedDateTo} 23:59:59` };
        },
      ),
      makeFilter(
        !JSON.parse(filterParams.allFacilities || false),
        'location.facility_id = :facilityId',
        ({ facilityId }) => ({ facilityId }),
      ),
      makeFilter(
        filterParams.publishedDate,
        'lab_requests.published_date LIKE :publishedDate',
        ({ publishedDate }) => {
          return {
            publishedDate: `${publishedDate}%`,
          };
        },
      ),
      makeDeletedAtIsNullFilter('encounter'),
      makeFilter(
        mustExcludeSensitive,
        `NOT EXISTS (
          SELECT 1
          FROM lab_tests
          INNER JOIN lab_test_types
            ON (lab_test_types.id = lab_tests.lab_test_type_id)
          WHERE lab_tests.lab_request_id = lab_requests.id
            AND lab_test_types.is_sensitive IS TRUE
        )`,
        () => {},
      ),
    ].filter(f => f);

    const { whereClauses, filterReplacements } = getWhereClausesAndReplacementsFromFilters(
      filters,
      filterParams,
    );

    const isInvoicingEnabled = await settings[filterParams.facilityId]?.get(
      'features.invoicing.enabled',
    );

    const from = `
      FROM lab_requests
        LEFT JOIN encounters AS encounter
          ON (encounter.id = lab_requests.encounter_id)
        LEFT JOIN locations AS location
          ON (encounter.location_id = location.id)
        LEFT JOIN reference_data AS category
          ON (category.type = 'labTestCategory' AND lab_requests.lab_test_category_id = category.id)
        LEFT JOIN reference_data AS priority
          ON (priority.type = 'labTestPriority' AND lab_requests.lab_test_priority_id = priority.id)
        LEFT JOIN reference_data AS laboratory
          ON (laboratory.type = 'labTestLaboratory' AND lab_requests.lab_test_laboratory_id = laboratory.id)
        LEFT JOIN reference_data AS site
          ON (site.type = 'labSampleSite' AND lab_requests.lab_sample_site_id = site.id)
        LEFT JOIN LATERAL (
          SELECT
            string_agg(ltp.name, ', ' ORDER BY ltp.name) AS name,
            -- The list is not a per-panel view (that is card D4); expose a single panel id only
            -- when the request holds exactly one panel, so a multi-panel request is never shown
            -- as, or mistaken for, one of its panels.
            CASE WHEN count(*) = 1 THEN min(ltp.id) ELSE NULL END AS id
          FROM lab_test_panel_requests AS ltpr
          INNER JOIN lab_test_panels AS ltp
            ON (ltp.id = ltpr.lab_test_panel_id)
          WHERE ltpr.lab_request_id = lab_requests.id
        ) lab_test_panel ON TRUE
        LEFT JOIN patients AS patient
          ON (patient.id = encounter.patient_id)
        LEFT JOIN users AS examiner
          ON (examiner.id = encounter.examiner_id)
        LEFT JOIN users AS requester
          ON (requester.id = lab_requests.requested_by_id)
        ${
          isInvoicingEnabled
            ? `
        LEFT JOIN LATERAL (
          SELECT COALESCE(
            -- Panel approval takes precedence (NULL if no panel items)
            (
              SELECT BOOL_AND(ii.approved)
              FROM invoice_items ii
              INNER JOIN lab_test_panel_requests ltpr
                ON (ltpr.id::text = ii.source_record_id)
              WHERE ltpr.lab_request_id = lab_requests.id
                AND ii.source_record_type = 'LabTestPanelRequest'
                AND ii.deleted_at IS NULL
              HAVING COUNT(*) > 0
            ),
            -- Individual test approval (used if panel returned NULL)
            (
              SELECT BOOL_AND(ii.approved)
              FROM lab_tests lt
              INNER JOIN invoice_items ii ON ii.source_record_id = lt.id::text
                AND ii.source_record_type = 'LabTest'
                AND ii.deleted_at IS NULL
              WHERE lt.lab_request_id = lab_requests.id
                AND lt.deleted_at IS NULL
              HAVING COUNT(*) > 0
            )
          ) AS approved
        ) lab_approval ON true`
            : ''
        }
        ${whereClauses && `WHERE ${whereClauses}`}
    `;

    const countResult = await req.db.query(
      `
      SELECT COUNT(1) AS count ${from}
      `,
      { replacements: filterReplacements, type: QueryTypes.SELECT },
    );

    const count = parseInt(countResult[0].count, 10);

    if (count === 0) {
      // save ourselves a query
      res.send({ data: [], count });
      return;
    }

    const sortKeys = {
      displayId: 'patient.display_id',
      patientName: 'UPPER(patient.last_name)',
      requestId: 'lab_requests.display_id',
      testCategory: 'category.name',
      labTestPanelName: 'lab_test_panel.id',
      requestedDate: 'requested_date',
      requestedBy: 'examiner.display_name',
      priority: 'priority.name',
      status: 'status',
      publishedDate: 'published_date',
      ...(isInvoicingEnabled ? { approved: 'lab_approval.approved' } : {}),
    };

    const getNullPosition = (orderBy, sortDirection) => {
      if (orderBy === 'approved') {
        return 'NULLS LAST';
      }
      return sortDirection === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST';
    };

    const sortKey = sortKeys[orderBy];
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const nullPosition = getNullPosition(orderBy, sortDirection);

    const result = await req.db.query(
      `
        SELECT
          lab_requests.*,
          ${isInvoicingEnabled ? `lab_approval.approved AS approved,` : ''}
          patient.display_id AS patient_display_id,
          patient.id AS patient_id,
          patient.first_name AS first_name,
          patient.last_name AS last_name,
          examiner.display_name AS examiner,
          requester.display_name AS requested_by,
          encounter.id AS encounter_id,
          category.id AS category_id,
          category.name AS category_name,
          priority.id AS priority_id,
          priority.name AS priority_name,
          lab_test_panel.name as lab_test_panel_name,
          lab_test_panel.id as lab_test_panel_id,
          laboratory.id AS laboratory_id,
          laboratory.name AS laboratory_name,
          location.facility_id AS facility_id
        ${from}

        ORDER BY ${sortKey} ${sortDirection}${nullPosition ? ` ${nullPosition}` : ''}
        LIMIT :limit
        OFFSET :offset
      `,
      {
        replacements: {
          ...filterReplacements,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          sortKey,
          sortDirection,
        },
        model: LabRequest,
        type: QueryTypes.SELECT,
        mapToModel: true,
      },
    );

    const forResponse = result.map(x => renameObjectKeys(x.forResponse()));
    res.send({
      data: forResponse,
      count,
    });
  }),
);

labRequest.post(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    const { models, body, params } = req;
    const { id } = params;
    req.checkPermission('write', 'LabRequest');
    const lab = await models.LabRequest.findByPk(id, {
      include: [{ association: 'tests', include: ['labTestType'] }],
    });
    if (!lab) {
      throw new NotFoundError();
    }
    req.checkPermission('write', lab);
    const hasSensitiveTests = lab.tests.some(test => test.labTestType.isSensitive);
    if (hasSensitiveTests) {
      req.checkPermission('write', 'SensitiveLabRequest');
    }
    const note = await lab.createNote(body);
    res.send(note);
  }),
);

const labRelations = permissionCheckingRouter('read', 'LabRequest');

labRelations.get('/:id/notes', notesWithSingleItemListHandler(NOTE_RECORD_TYPES.LAB_REQUEST));
labRelations.get(
  '/:id/tests',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { LabTest, LabTestPanelLabTestTypes } = models;
    req.checkPermission('list', 'LabTest');
    const canListSensitive = req.ability.can('list', 'SensitiveLabRequest');

    // Load every test on the request with what's needed to group and order it: its panel (via the
    // panel request) and, below, its reference-data order within that panel. Panel-ordered display
    // for a request holding several panels lives here (card D4); Y3 left multi-panel ordering to
    // this view. Per-request test counts are small, so grouping and paging are done in memory.
    const tests = await LabTest.findAll({
      where: {
        labRequestId: params.id,
        ...(!canListSensitive && { '$labTestType.is_sensitive$': false }),
      },
      include: [
        'category',
        'labTestMethod',
        'labTestType',
        { association: 'labTestPanelRequest', required: false, include: ['labTestPanel'] },
      ],
    });

    // Reference-data order for each (panel, test type) pairing present on the request.
    const panelIds = [
      ...new Set(tests.map(test => test.labTestPanelRequest?.labTestPanelId).filter(Boolean)),
    ];
    const panelOrderRows = panelIds.length
      ? await LabTestPanelLabTestTypes.findAll({ where: { labTestPanelId: panelIds } })
      : [];
    const orderKey = (panelId, testTypeId) => `${panelId}:${testTypeId}`;
    const orderWithinPanel = new Map(
      panelOrderRows.map(row => [orderKey(row.labTestPanelId, row.labTestTypeId), row.order]),
    );

    const collator = new Intl.Collator();
    const panelNameOf = test => test.labTestPanelRequest?.labTestPanel?.name ?? '';
    const testNameOf = test => test.labTestType?.name ?? '';
    const panelOrderOf = test =>
      orderWithinPanel.get(orderKey(test.labTestPanelRequest?.labTestPanelId, test.labTestTypeId)) ??
      0;

    // Panels first, alphabetically by panel name, their tests in reference-data order; then the
    // individual (unattributed) tests — including reflex tests added by the lab — alphabetically.
    const panelTests = tests
      .filter(test => test.labTestPanelRequestId)
      .sort(
        (a, b) =>
          collator.compare(panelNameOf(a), panelNameOf(b)) ||
          panelOrderOf(a) - panelOrderOf(b) ||
          collator.compare(testNameOf(a), testNameOf(b)),
      );
    const individualTests = tests
      .filter(test => !test.labTestPanelRequestId)
      .sort((a, b) => collator.compare(testNameOf(a), testNameOf(b)));

    const ordered = [...panelTests, ...individualTests];

    const page = Number.parseInt(query.page, 10) || 0;
    const rowsPerPage = query.rowsPerPage ? Number.parseInt(query.rowsPerPage, 10) : undefined;
    const pageTests = rowsPerPage
      ? ordered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : ordered;

    // The panel each row belongs to travels with the row so the view can group by it.
    const data = pageTests.map(test => {
      const panel = test.labTestPanelRequest?.labTestPanel;
      return {
        ...test.forResponse(),
        labTestPanel: panel ? { id: panel.id, name: panel.name } : null,
      };
    });

    res.send({ count: ordered.length, data });
  }),
);

labRelations.put(
  '/:id/tests',
  asyncHandler(async (req, res) => {
    const { models, params, body, db, user } = req;
    const { id } = params;
    const { resultsInterpretation, labTests = {} } = body;
    req.checkPermission('write', 'LabTest');

    const testIds = Object.keys(labTests);

    const labRequest = await models.LabRequest.findByPk(id, {
      include: [
        {
          model: models.LabTest,
          as: 'tests',
          include: [
            {
              model: models.LabTestType,
              as: 'labTestType',
            },
          ],
        },
      ],
    });
    const labTestRecords = labRequest.tests; // LabTest records

    // Reject all updates if it includes sensitive tests and user lacks permission
    const areSensitiveTests = labTestRecords.some(test => test.labTestType.isSensitive);
    if (areSensitiveTests) {
      req.checkPermission('write', 'SensitiveLabRequest');
    }

    // If any of the tests have a different result or secondaryResult, check for LabTestResult permission
    const labTestObj = keyBy(labTestRecords, 'id');
    if (
      Object.entries(labTests).some(([testId, testBody]) => {
        const existingTest = labTestObj[testId];
        if (!existingTest) return false;
        const resultChanged = testBody.result && testBody.result !== existingTest.result;
        const secondaryResultChanged =
          testBody.secondaryResult && testBody.secondaryResult !== existingTest.secondaryResult;
        return resultChanged || secondaryResultChanged;
      })
    ) {
      req.checkPermission('write', 'LabTestResult');
    }

    // Check if all test IDs in the body actually belong to this lab request
    if (testIds.length > 0) {
      const invalidTestIds = testIds.filter(testId => !labTestObj[testId]);
      if (invalidTestIds.length > 0) {
        throw new NotFoundError();
      }
    }

    await db.transaction(async () => {
      if (
        resultsInterpretation !== undefined &&
        resultsInterpretation !== labRequest.resultsInterpretation
      ) {
        await labRequest.update({ resultsInterpretation });
      }

      const promises = [];

      labTestRecords.forEach(labTestRecord => {
        const testData = labTests[labTestRecord.id];
        if (testData) {
          req.checkPermission('write', labTestRecord);
          const updated = labTestRecord.set(testData);
          if (updated.changed()) {
            // Temporary solution for lab test officer string field
            // using displayName of current user
            labTestRecord.set('laboratoryOfficer', user.displayName);
            promises.push(updated.save());
          }
        }
      });

      res.send(await Promise.all(promises));
    });
  }),
);

labRequest.use(labRelations);

export const labTest = express.Router();

labTest.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      models,
      params,
      query: { facilityId },
    } = req;
    const labTestId = params.id;

    req.checkPermission('read', 'LabTest');

    const response = await models.LabTest.findByPk(labTestId, {
      include: [
        {
          model: models.LabRequest,
          as: 'labRequest',
          include: [
            {
              model: models.Encounter,
              as: 'encounter',
              attributes: ['id', 'patientId'],
            },
          ],
        },
        { model: models.LabTestType, as: 'labTestType' },
        { model: models.ReferenceData, as: 'labTestMethod' },
      ],
    });

    if (response.labTestType.isSensitive === true) {
      req.checkPermission('read', 'SensitiveLabRequest');
    }

    await req.audit.access({
      recordId: response.id,
      frontEndContext: req.params,
      model: models.LabTest,
      facilityId,
    });

    res.send(response);
  }),
);

labTest.get(
  '/:id/history',
  asyncHandler(async (req, res) => {
    const {
      models,
      params,
      query: { facilityId },
    } = req;
    const labTestId = params.id;

    req.checkPermission('read', 'LabTest');
    req.checkPermission('read', 'LabTestResult');

    // First, check if this lab test exists and get its info
    const labTest = await models.LabTest.findByPk(labTestId, {
      include: [{ model: models.LabTestType, as: 'labTestType' }],
    });

    if (!labTest) {
      throw new NotFoundError();
    }

    if (labTest.labTestType.isSensitive === true) {
      req.checkPermission('read', 'SensitiveLabRequest');
    }

    await req.audit.access({
      recordId: labTest.id,
      frontEndContext: req.params,
      model: models.LabTest,
      facilityId,
    });

    const changeLogs = await models.ChangeLog.findAll({
      where: {
        tableName: 'lab_tests',
        recordId: labTestId,
      },
      include: [
        {
          model: models.User,
          as: 'updatedByUser',
          attributes: ['id', 'displayName'],
        },
      ],
      order: [['loggedAt', 'ASC']],
      raw: false,
    });

    const changes = [];
    let prevResult = null;
    let prevSecondaryResult = null;

    for (const changeLog of changeLogs) {
      const { id, loggedAt, updatedByUserId, updatedByUser, recordData = {} } = changeLog;
      const result = recordData.result || null;
      const secondaryResult = recordData.secondary_result || null;

      if (secondaryResult !== prevSecondaryResult) {
        changes.push({
          id: `${id}-secondaryResult`,
          loggedAt,
          result: secondaryResult,
          fieldType: 'secondaryResult',
          updatedByUserId,
          updatedByDisplayName: updatedByUser?.displayName,
        });
        prevSecondaryResult = secondaryResult;
      }

      if (result !== prevResult) {
        changes.push({
          id: `${id}-result`,
          loggedAt,
          result,
          fieldType: 'result',
          updatedByUserId,
          updatedByDisplayName: updatedByUser?.displayName,
        });
        prevResult = result;
      }
    }

    changes.reverse();
    res.send(changes);
  }),
);

export const labTestType = express.Router();
labTestType.get('/:id', simpleGetList('LabTestType', 'labTestCategoryId'));
labTestType.get(
  '/',
  asyncHandler(async (req, res) => {
    const { models, query } = req;
    req.checkPermission('list', 'LabTestType');
    const canCreateSensitive = req.ability.can('create', 'SensitiveLabRequest');
    const where = {
      visibilityStatus: {
        [Op.notIn]: [
          LAB_TEST_TYPE_VISIBILITY_STATUSES.PANEL_ONLY,
          LAB_TEST_TYPE_VISIBILITY_STATUSES.HISTORICAL,
        ],
      },
      ...(!canCreateSensitive && { isSensitive: false }),
    };
    if (query.facilityId) {
      where[Op.and] = [
        Sequelize.literal(
          `("LabTestType"."available_facilities" IS NULL OR "LabTestType"."available_facilities" @> ${req.db.escape(JSON.stringify([query.facilityId]))}::jsonb)`,
        ),
      ];
    }
    const labTests = await models.LabTestType.findAll({
      include: [
        {
          model: models.ReferenceData,
          as: 'category',
        },
      ],
      where,
    });
    res.send(labTests);
  }),
);

export const labTestPanel = express.Router();

labTestPanel.get('/', async (req, res) => {
  req.checkPermission('list', 'LabTestPanel');
  const { models, query } = req;
  const canCreateSensitive = req.ability.can('create', 'SensitiveLabRequest');
  const where = {
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
  };
  if (query.facilityId) {
    const escapedFacilityArray = req.db.escape(JSON.stringify([query.facilityId]));
    where[Op.and] = [
      Sequelize.literal(
        `("LabTestPanel"."available_facilities" IS NULL OR "LabTestPanel"."available_facilities" @> ${escapedFacilityArray}::jsonb)`,
      ),
    ];
  }
  const panels = await models.LabTestPanel.findAll({
    include: [
      {
        model: models.ReferenceData,
        as: 'category',
      },
      {
        model: models.LabTestType,
        as: 'labTestTypes',
        attributes: ['id', 'code', 'name', 'isSensitive', 'availableFacilities'],
        through: { attributes: ['order'] },
      },
    ],
    where,
  });
  // Panel members inherit the same sensitivity and facility gating as GET /labTestType, so a panel
  // never exposes tests the user can't see or that aren't available at their facility.
  const response = panels.map(panel => {
    const plain = panel.toJSON();
    plain.labTestTypes = (plain.labTestTypes ?? [])
      .filter(
        member =>
          (canCreateSensitive || !member.isSensitive) &&
          (!query.facilityId ||
            !member.availableFacilities ||
            member.availableFacilities.includes(query.facilityId)),
      )
      .map(({ id, code, name, LabTestPanelLabTestTypes }) => ({
        id,
        code,
        name,
        LabTestPanelLabTestTypes,
      }));
    return plain;
  });
  res.send(response);
});

labTestPanel.get('/:id', simpleGet('LabTestPanel'));

labTestPanel.get(
  '/:id/labTestTypes',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const panelId = params.id;
    req.checkPermission('list', 'LabTest');
    const panel = await models.LabTestPanel.findByPk(panelId);
    if (!panel) {
      throw new NotFoundError();
    }
    const options = {
      include: [
        {
          model: models.ReferenceData,
          as: 'category',
        },
      ],
    };
    if (query.facilityId) {
      options.where = {
        [Op.and]: [
          Sequelize.literal(
            `("LabTestType"."available_facilities" IS NULL OR "LabTestType"."available_facilities" @> ${req.db.escape(JSON.stringify([query.facilityId]))}::jsonb)`,
          ),
        ],
      };
    }
    const response = await panel.getLabTestTypes(options);
    res.send(response);
  }),
);

// A panel joins the request for its own category. A panel with no category of its own joins the
// request for the category its test types share; where they don't share one, it forms its own
// request (a synthetic group key keeps it unmerged), matching how a category-less panel behaves.
function resolvePanelGroup(panel, memberTestTypes) {
  if (panel.categoryId) {
    return { key: `category:${panel.categoryId}`, categoryId: panel.categoryId };
  }
  const sharedCategoryIds = [
    ...new Set(memberTestTypes.map(testType => testType.labTestCategoryId).filter(Boolean)),
  ];
  if (sharedCategoryIds.length === 1) {
    const [categoryId] = sharedCategoryIds;
    return { key: `category:${categoryId}`, categoryId };
  }
  return { key: `panel:${panel.id}`, categoryId: null };
}

// A submission produces one lab request per lab test category, holding both the panels and the
// individual tests ordered from that category.
async function createLabRequestsByCategory(models, body, note, user) {
  const { panelIds = [], labTestTypeIds = [], sampleDetails = {}, ...labRequestBody } = body;
  // note is handled separately by the caller; keep it out of the request payload.
  delete labRequestBody.note;

  const encounter = await models.Encounter.findByPk(labRequestBody.encounterId, {
    include: [{ model: models.Location, as: 'location', attributes: ['facilityId'] }],
  });
  const facilityId = encounter?.location?.facilityId;
  const isAvailableAtFacility = testType =>
    !facilityId || !testType.availableFacilities || testType.availableFacilities.includes(facilityId);

  const groups = new Map();
  const groupFor = (key, categoryId) => {
    if (!groups.has(key)) {
      groups.set(key, { categoryId, panels: [], individualTestTypeIds: [] });
    }
    return groups.get(key);
  };

  if (panelIds.length) {
    const panels = await models.LabTestPanel.findAll({
      where: { id: panelIds },
      include: [
        {
          model: models.LabTestType,
          as: 'labTestTypes',
          attributes: ['id', 'availableFacilities', 'labTestCategoryId'],
        },
      ],
    });

    for (const panel of panels) {
      const memberTestTypes = panel.labTestTypes ?? [];
      const availableTestTypeIds = memberTestTypes
        .filter(isAvailableAtFacility)
        .map(testType => testType.id);
      if (!availableTestTypeIds.length) {
        throw new InvalidOperationError(
          'A submission cannot include a panel with no test types available at this facility',
        );
      }

      const { key, categoryId } = resolvePanelGroup(panel, memberTestTypes);
      groupFor(key, categoryId).panels.push({
        labTestPanelId: panel.id,
        labTestTypeIds: availableTestTypeIds,
      });
    }
  }

  if (labTestTypeIds.length) {
    const categories = await models.LabTestType.findAll({
      attributes: [
        [Sequelize.fn('array_agg', Sequelize.col('id')), 'lab_test_type_ids'],
        'lab_test_category_id',
      ],
      where: { id: { [Op.in]: labTestTypeIds } },
      group: ['lab_test_category_id'],
    });

    const validTestTypeCount = categories.reduce(
      (total, category) => total + category.get('lab_test_type_ids').length,
      0,
    );
    if (validTestTypeCount < labTestTypeIds.length) {
      throw new InvalidOperationError('Invalid test type id');
    }

    for (const category of categories) {
      const categoryId = category.get('lab_test_category_id');
      groupFor(`category:${categoryId}`, categoryId).individualTestTypeIds.push(
        ...category.get('lab_test_type_ids'),
      );
    }
  }

  const response = [];
  for (const group of groups.values()) {
    const requestSampleDetails = (group.categoryId && sampleDetails[group.categoryId]) || {};
    response.push(await createLabRequest(labRequestBody, requestSampleDetails, group, models, note, user));
  }
  return response;
}

async function createLabRequest(labRequestBody, requestSampleDetails, group, models, note, user) {
  const labRequestData = {
    ...labRequestBody,
    ...requestSampleDetails,
    specimenAttached: Boolean(requestSampleDetails.specimenTypeId),
    status: requestSampleDetails.sampleTime
      ? LAB_REQUEST_STATUSES.RECEPTION_PENDING
      : LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
    labTestTypeIds: group.individualTestTypeIds,
    panels: group.panels,
    labTestCategoryId: group.categoryId,
    userId: user.id,
  };

  const newLabRequest = await models.LabRequest.createWithTests(labRequestData);
  if (note?.content) {
    await newLabRequest.createNote({
      noteTypeId: NOTE_TYPES.OTHER,
      date: note.date,
      ...note,
      authorId: user.id,
    });
  }
  return newLabRequest;
}
