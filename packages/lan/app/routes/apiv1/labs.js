import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import { startOfDay, endOfDay } from 'date-fns';
import { Op, QueryTypes, Sequelize } from 'sequelize';

import { NotFoundError, InvalidOperationError } from '@tamanu/shared/errors';
import { toDateTimeString } from '@tamanu/shared/utils/dateTime';
import {
  LAB_REQUEST_STATUSES,
  NOTE_TYPES,
  NOTE_RECORD_TYPES,
  VISIBILITY_STATUSES,
  LAB_TEST_TYPE_VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { keyBy } from 'lodash';
import { renameObjectKeys } from 'shared/utils';
import { simpleGet, simpleGetList, permissionCheckingRouter } from 'shared/utils/crudHelpers';
import {
  getWhereClausesAndReplacementsFromFilters,
  makeFilter,
  makeSimpleTextFilterFactory,
  makeSubstringTextFilterFactory,
} from '../../utils/query';
import { notesWithSingleItemListHandler } from '../../routeHandlers';

export const labRequest = express.Router();

labRequest.get('/:id', simpleGet('LabRequest'));

labRequest.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params, db } = req;
    const { userId, ...labRequestData } = req.body;
    req.checkPermission('read', 'LabRequest');
    const labRequestRecord = await models.LabRequest.findByPk(params.id);
    if (!labRequestRecord) throw new NotFoundError();
    req.checkPermission('write', labRequestRecord);

    if (labRequestData.status && labRequestData.status !== labRequestRecord.status) {
      req.checkPermission('write', 'LabRequestStatus');
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

      await labRequestRecord.update(labRequestData);
    });

    res.send(labRequestRecord);
  }),
);

labRequest.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, user } = req;
    const { panelIds, labTestTypeIds, note } = body;
    req.checkPermission('create', 'LabRequest');

    if (!panelIds?.length && !labTestTypeIds?.length) {
      throw new InvalidOperationError('A lab request must have at least one test or panel');
    }

    const response = panelIds?.length
      ? await createPanelLabRequests(models, body, note, user)
      : await createIndividualLabRequests(models, body, note, user);

    res.send(response);
  }),
);

labRequest.get(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { LabRequest },
      query,
    } = req;
    req.checkPermission('list', 'LabRequest');

    const {
      order = 'ASC',
      orderBy = 'displayId',
      rowsPerPage = 10,
      page = 0,
      ...filterParams
    } = query;

    const makeSimpleTextFilter = makeSimpleTextFilterFactory(filterParams);
    const makePartialTextFilter = makeSubstringTextFilterFactory(filterParams);
    const filters = [
      makeFilter(true, `lab_requests.status != :deleted`, () => ({
        deleted: LAB_REQUEST_STATUSES.DELETED,
      })),
      makeFilter(true, `lab_requests.status != :cancelled`, () => ({
        cancelled: LAB_REQUEST_STATUSES.CANCELLED,
      })),
      makeFilter(true, `lab_requests.status != :enteredInError`, () => ({
        enteredInError: LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
      })),
      makeSimpleTextFilter('status', 'lab_requests.status'),
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
      makeSimpleTextFilter('labTestPanelId', 'lab_test_panel.id'),
      makeFilter(
        filterParams.requestedDateFrom,
        'lab_requests.requested_date >= :requestedDateFrom',
        ({ requestedDateFrom }) => ({
          requestedDateFrom: toDateTimeString(startOfDay(new Date(requestedDateFrom))),
        }),
      ),
      makeFilter(
        filterParams.requestedDateTo,
        'lab_requests.requested_date <= :requestedDateTo',
        ({ requestedDateTo }) => ({
          requestedDateTo: toDateTimeString(endOfDay(new Date(requestedDateTo))),
        }),
      ),
      makeFilter(
        !JSON.parse(filterParams.allFacilities || false),
        'location.facility_id = :facilityId',
        () => ({ facilityId: config.serverFacilityId }),
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
      makeFilter(
        filterParams.status !== LAB_REQUEST_STATUSES.PUBLISHED,
        'lab_requests.status != :published',
        () => ({
          published: LAB_REQUEST_STATUSES.PUBLISHED,
        }),
      ),
      makeFilter(true, 'encounter.deletion_status = :deletionStatus', () => ({
        deletionStatus: null,
      })),
    ].filter(f => f);

    const { whereClauses, filterReplacements } = getWhereClausesAndReplacementsFromFilters(
      filters,
      {},
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
        LEFT JOIN lab_test_panel_requests AS lab_test_panel_requests
          ON (lab_test_panel_requests.id = lab_requests.lab_test_panel_request_id)
        LEFT JOIN lab_test_panels AS lab_test_panel
          ON (lab_test_panel.id = lab_test_panel_requests.lab_test_panel_id)
        LEFT JOIN patients AS patient
          ON (patient.id = encounter.patient_id)
        LEFT JOIN users AS examiner
          ON (examiner.id = encounter.examiner_id)
        LEFT JOIN users AS requester
          ON (requester.id = lab_requests.requested_by_id)
        ${whereClauses && `WHERE ${whereClauses}`}
    `;

    const countResult = await req.db.query(`SELECT COUNT(1) AS count ${from}`, {
      replacements: filterReplacements,
      type: QueryTypes.SELECT,
    });

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
    };

    const sortKey = sortKeys[orderBy];
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const nullPosition = sortDirection === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST';

    const result = await req.db.query(
      `
        SELECT
          lab_requests.*,
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
    const lab = await models.LabRequest.findByPk(id);
    if (!lab) {
      throw new NotFoundError();
    }
    req.checkPermission('write', lab);
    const note = await lab.createNote(body);
    res.send(note);
  }),
);

const labRelations = permissionCheckingRouter('read', 'LabRequest');

labRelations.get('/:id/tests', simpleGetList('LabTest', 'labRequestId'));
labRelations.get('/:id/notes', notesWithSingleItemListHandler(NOTE_RECORD_TYPES.LAB_REQUEST));

labRelations.put(
  '/:id/tests',
  asyncHandler(async (req, res) => {
    const { models, params, body, db, user } = req;
    const { id } = params;
    req.checkPermission('write', 'LabTest');

    const testIds = Object.keys(body);

    const labTests = await models.LabTest.findAll({
      where: {
        labRequestId: id,
        id: testIds,
      },
    });

    // If any of the tests have a different result, check for LabTestResult permission
    const labTestObj = keyBy(labTests, 'id');
    if (
      Object.entries(body).some(
        ([testId, testBody]) => testBody.result && testBody.result !== labTestObj[testId].result,
      )
    ) {
      req.checkPermission('write', 'LabTestResult');
    }

    if (labTests.length !== testIds.length) {
      // Not all lab tests exist on specified lab request
      throw new NotFoundError();
    }

    db.transaction(async () => {
      const promises = [];

      labTests.forEach(labTest => {
        req.checkPermission('write', labTest);
        const labTestBody = body[labTest.id];
        const updated = labTest.set(labTestBody);
        if (updated.changed()) {
          // Temporary solution for lab test officer string field
          // using displayName of current user
          labTest.set('laboratoryOfficer', user.displayName);
          promises.push(updated.save());
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
    const { models, params } = req;
    const labTestId = params.id;

    req.checkPermission('read', 'LabTest');

    const response = await models.LabTest.findByPk(labTestId, {
      include: [
        { model: models.LabRequest, as: 'labRequest' },
        { model: models.LabTestType, as: 'labTestType' },
        { model: models.ReferenceData, as: 'labTestMethod' },
      ],
    });

    res.send(response);
  }),
);

export const labTestType = express.Router();
labTestType.get('/:id', simpleGetList('LabTestType', 'labTestCategoryId'));
labTestType.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    req.checkPermission('list', 'LabTestType');
    const labTests = await models.LabTestType.findAll({
      include: [
        {
          model: models.ReferenceData,
          as: 'category',
        },
      ],
      // We dont include lab tests with a visibility status of panels only in this route as it is only used for the indivudual lab workflow
      where: {
        visibilityStatus: {
          [Op.notIn]: [
            LAB_TEST_TYPE_VISIBILITY_STATUSES.PANEL_ONLY,
            LAB_TEST_TYPE_VISIBILITY_STATUSES.HISTORICAL,
          ],
        },
      },
    });
    res.send(labTests);
  }),
);

export const labTestPanel = express.Router();

labTestPanel.get('/', async (req, res) => {
  req.checkPermission('list', 'LabTestPanel');
  const { models } = req;
  const response = await models.LabTestPanel.findAll({
    include: [
      {
        model: models.ReferenceData,
        as: 'category',
      },
    ],
    where: {
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  });
  res.send(response);
});

labTestPanel.get('/:id', simpleGet('LabTestPanel'));

labTestPanel.get(
  '/:id/labTestTypes',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const panelId = params.id;
    req.checkPermission('list', 'LabTest');
    const panel = await models.LabTestPanel.findByPk(panelId);
    if (!panel) {
      throw new NotFoundError();
    }
    const response = await panel.getLabTestTypes({
      include: [
        {
          model: models.ReferenceData,
          as: 'category',
        },
      ],
    });

    res.send(response);
  }),
);

async function createPanelLabRequests(models, body, note, user) {
  const { panelIds, sampleDetails = {}, ...labRequestBody } = body;
  const panels = await models.LabTestPanel.findAll({
    where: {
      id: panelIds,
    },
    include: [
      {
        model: models.LabTestType,
        as: 'labTestTypes',
        attributes: ['id'],
      },
    ],
  });

  const response = await Promise.all(
    panels.map(async panel => {
      const panelId = panel.id;
      const testPanelRequest = await models.LabTestPanelRequest.create({
        labTestPanelId: panelId,
        encounterId: labRequestBody.encounterId,
      });
      labRequestBody.labTestPanelRequestId = testPanelRequest.id;

      const requestSampleDetails = sampleDetails[panelId] || {};
      const labTestTypeIds = panel.labTestTypes?.map(testType => testType.id) || [];
      const labTestCategoryId = panel.categoryId;
      const newLabRequest = await createLabRequest(
        labRequestBody,
        requestSampleDetails,
        labTestTypeIds,
        labTestCategoryId,
        models,
        note,
        user,
      );
      return newLabRequest;
    }),
  );
  return response;
}

async function createLabRequest(
  labRequestBody,
  requestSampleDetails,
  labTestTypeIds,
  labTestCategoryId,
  models,
  note,
  user,
) {
  const labRequestData = {
    ...labRequestBody,
    ...requestSampleDetails,
    specimenAttached: requestSampleDetails.specimenTypeId ? 'yes' : 'no',
    status: requestSampleDetails.sampleTime
      ? LAB_REQUEST_STATUSES.RECEPTION_PENDING
      : LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
    labTestTypeIds,
    labTestCategoryId,
    userId: user.id,
  };

  const newLabRequest = await models.LabRequest.createWithTests(labRequestData);
  if (note?.content) {
    await newLabRequest.createNote({
      noteType: NOTE_TYPES.OTHER,
      date: note.date,
      ...note,
      authorId: user.id,
    });
  }
  return newLabRequest;
}

async function createIndividualLabRequests(models, body, note, user) {
  const { labTestTypeIds } = body;

  const categories = await models.LabTestType.findAll({
    attributes: [
      [Sequelize.fn('array_agg', Sequelize.col('id')), 'lab_test_type_ids'],
      'lab_test_category_id',
    ],
    where: {
      id: {
        [Op.in]: labTestTypeIds,
      },
    },
    group: ['lab_test_category_id'],
  });

  // Check to see that all the test types are valid
  const count = categories.reduce(
    (validTestTypesCount, category) =>
      validTestTypesCount + category.get('lab_test_type_ids').length,
    0,
  );

  if (count < labTestTypeIds.length) {
    throw new InvalidOperationError('Invalid test type id');
  }

  const { sampleDetails = {}, ...labRequestBody } = body;

  const response = await Promise.all(
    categories.map(async category => {
      const categoryId = category.get('lab_test_category_id');
      const requestSampleDetails = sampleDetails[categoryId] || {};
      const newLabRequest = await createLabRequest(
        labRequestBody,
        requestSampleDetails,
        category.get('lab_test_type_ids'),
        categoryId,
        models,
        note,
        user,
      );
      return newLabRequest;
    }),
  );
  return response;
}
