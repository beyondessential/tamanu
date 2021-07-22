import express from 'express';
import asyncHandler from 'express-async-handler';
import moment from 'moment';
import { QueryTypes } from 'sequelize';

import { NOTE_RECORD_TYPES } from 'shared/models/Note';
import { NotFoundError, InvalidOperationError } from 'shared/errors';
import { REFERENCE_TYPES } from 'shared/constants';
import { makeFilter } from '~/utils/query';
import { renameObjectKeys } from '~/utils/renameObjectKeys';
import { simpleGet, simplePut, simpleGetList, permissionCheckingRouter } from './crudHelpers';

export const labRequest = express.Router();

labRequest.get('/:id', simpleGet('LabRequest'));

labRequest.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { userId, ...rest } = req.body;
    req.checkPermission('read', 'LabRequest');
    const object = await models.LabRequest.findByPk(params.id);
    if (!object) throw new NotFoundError();
    req.checkPermission('write', object);
    await object.update(rest);

    if (rest.status) {
      if (!userId) throw new InvalidOperationError('No user found for LabRequest status change.');
      await models.LabRequestLog.create({
        status: rest.status,
        labRequestId: params.id,
        updatedById: userId,
      });
    }

    res.send(object);
  }),
);

labRequest.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    req.checkPermission('create', 'LabRequest');
    const object = await models.LabRequest.createWithTests(req.body);
    res.send(object);
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

    const { rowsPerPage = 10, page = 0, ...filterParams } = query;

    const filters = [
      makeFilter(
        filterParams.status,
        `UPPER(lab_requests.status) LIKE UPPER(:status)`,
        ({ status }) => ({ status: `${status}%` }),
      ),
      makeFilter(
        filterParams.requestId,
        `UPPER(lab_requests.display_id) LIKE UPPER(:requestId)`,
        ({ requestId }) => ({ requestId: `${requestId}%` }),
      ),
      makeFilter(
        filterParams.category,
        `UPPER(category.name) LIKE UPPER(:category)`,
        ({ category }) => ({ category: `${category}%` }),
      ),
      makeFilter(
        filterParams.priority,
        `UPPER(priority.name) LIKE UPPER(:priority)`,
        ({ priority }) => ({ priority: `${priority}%` }),
      ),
      makeFilter(
        filterParams.laboratory,
        `UPPER(laboratory.name) LIKE UPPER(:laboratory)`,
        ({ laboratory }) => ({ laboratory: `${laboratory}%` }),
      ),
      makeFilter(
        filterParams.displayId,
        `UPPER(patient.display_id) LIKE UPPER(:displayId)`,
        ({ displayId }) => ({ displayId: `${displayId}%` }),
      ),
      makeFilter(
        filterParams.requestedDateFrom,
        `DATE(lab_requests.requested_date) >= :requestedDateFrom`,
        ({ requestedDateFrom }) => ({
          requestedDateFrom: moment(requestedDateFrom)
            .startOf('day')
            .toISOString(),
        }),
      ),
      makeFilter(
        filterParams.requestedDateTo,
        `DATE(lab_requests.requested_date) <= :requestedDateTo`,
        ({ requestedDateTo }) => ({
          requestedDateTo: moment(requestedDateTo)
            .endOf('day')
            .toISOString(),
        }),
      ),
    ].filter(f => f);

    const whereClauses = filters.map(f => f.sql).join(' AND ');

    const from = `
      FROM lab_requests
        LEFT JOIN encounters AS encounter
          ON (encounter.id = lab_requests.encounter_id)
        LEFT JOIN reference_data AS category
          ON (category.type = 'labTestCategory' AND lab_requests.lab_test_category_id = category.id)
        LEFT JOIN reference_data AS priority
          ON (priority.type = 'labTestPriority' AND lab_requests.lab_test_priority_id = priority.id)
        LEFT JOIN reference_data AS laboratory
          ON (laboratory.type = 'labTestLaboratory' AND lab_requests.lab_test_laboratory_id = laboratory.id)
        LEFT JOIN patients AS patient
          ON (patient.id = encounter.patient_id)
        LEFT JOIN users AS examiner
          ON (examiner.id = encounter.examiner_id)
        LEFT JOIN users AS requester
          ON (requester.id = lab_requests.requested_by_id)
      ${whereClauses && `WHERE ${whereClauses}`}
    `;

    const filterReplacements = filters
      .filter(f => f.transform)
      .reduce(
        (current, { transform }) => ({
          ...current,
          ...transform(current),
        }),
        filterParams,
      );

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
          laboratory.id AS laboratory_id,
          laboratory.name AS laboratory_name
        ${from}

        LIMIT :limit
        OFFSET :offset
      `,
      {
        replacements: {
          ...filterReplacements,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
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
    const owner = await models.LabRequest.findByPk(id);
    if (!owner) {
      throw new NotFoundError();
    }
    req.checkPermission('write', owner);
    const createdNote = await models.Note.create({
      recordId: id,
      recordType: 'LabRequest',
      ...body,
    });

    res.send(createdNote);
  }),
);

const labRelations = permissionCheckingRouter('read', 'LabRequest');
labRelations.get('/:id/tests', simpleGetList('LabTest', 'labRequestId'));
labRelations.get(
  '/:id/notes',
  simpleGetList('Note', 'recordId', {
    additionalFilters: { recordType: NOTE_RECORD_TYPES.LAB_REQUEST },
  }),
);

labRequest.use(labRelations);

export const labTest = express.Router();

labTest.get(
  '/options$',
  asyncHandler(async (req, res) => {
    // always allow reading lab test options
    req.flagPermissionChecked();

    const records = await req.models.LabTestType.findAll();
    res.send({
      data: records,
      count: records.length,
    });
  }),
);

labTest.get(
  '/categories$',
  asyncHandler(async (req, res) => {
    // always allow reading lab test options
    req.flagPermissionChecked();

    const records = await req.models.ReferenceData.findAll({
      where: { type: REFERENCE_TYPES.LAB_TEST_CATEGORY },
    });

    res.send({
      data: records,
      count: records.length,
    });
  }),
);

labTest.get(
  '/priorities$',
  asyncHandler(async (req, res) => {
    // always allow reading lab urgency options
    req.flagPermissionChecked();

    const records = await req.models.ReferenceData.findAll({
      where: { type: REFERENCE_TYPES.LAB_TEST_PRIORITY },
    });

    res.send({
      data: records,
      count: records.length,
    });
  }),
);

labTest.put('/:id', simplePut('LabTest'));
