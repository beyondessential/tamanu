import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { NOTE_TYPES } from 'shared/constants';
import { NotFoundError } from 'shared/errors';
import { NOTE_RECORD_TYPES } from 'shared/models/Note';
import {
  mapQueryFilters,
  getCaseInsensitiveFilter,
  getTextToBooleanFilter,
} from '../../database/utils';
import { simpleGet, simplePut, simplePost, permissionCheckingRouter } from './crudHelpers';

// Object used to map field names to database column names
const SNAKE_CASE_COLUMN_NAMES = {
  firstName: 'first_name',
  lastName: 'last_name',
  displayId: 'display_id',
  id: 'ImagingRequest.id',
  name: 'name',
};

// Filtering functions for sequelize queries
const caseInsensitiveFilter = getCaseInsensitiveFilter(SNAKE_CASE_COLUMN_NAMES);
const urgencyTextToBooleanFilter = getTextToBooleanFilter('urgent');

export const imagingRequest = express.Router();

imagingRequest.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      models: { ImagingRequest, Note },
      params: { id },
    } = req;
    req.checkPermission('read', 'ImagingRequest');
    const imagingRequestObject = await ImagingRequest.findByPk(id, {
      include: ImagingRequest.getFullReferenceAssociations(),
    });
    if (!imagingRequestObject) throw new NotFoundError();

    // Get related note
    const noteObject = await Note.findOne({
      where: {
        recordType: NOTE_RECORD_TYPES.IMAGING_REQUEST,
        recordId: id,
      },
    });

    // Convert Sequelize model to use a custom object as response
    const responseObject = { ...imagingRequestObject.forResponse() };

    // Add note content if it exists
    if (noteObject) {
      responseObject.note = noteObject.content;
    }

    res.send(responseObject);
  }),
);

imagingRequest.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      models: { ImagingRequest, Note },
      params: { id },
    } = req;
    req.checkPermission('read', 'ImagingRequest');
    req.checkPermission('read', 'Note');
    const imagingRequestObject = await ImagingRequest.findByPk(id);
    if (!imagingRequestObject) throw new NotFoundError();
    req.checkPermission('write', 'imagingRequestObject');
    req.checkPermission('write', 'Note');
    await imagingRequestObject.update(req.body);

    // Get related note
    const noteObject = await Note.findOne({
      where: {
        recordType: NOTE_RECORD_TYPES.IMAGING_REQUEST,
        recordId: id,
      },
    });

    // Only the content of the note would be updatable
    await noteObject.update({ content: req.body.note });

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...imagingRequestObject.forResponse(),
      note: noteObject.content,
    };

    res.send(responseObject);
  }),
);

imagingRequest.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { ImagingRequest, Note },
    } = req;
    req.checkPermission('create', 'ImagingRequest');
    const newImagingRequest = await ImagingRequest.create(req.body);
    await Note.create({
      recordId: newImagingRequest.get('id'),
      recordType: NOTE_RECORD_TYPES.IMAGING_REQUEST,
      content: req.body.note,
      noteType: NOTE_TYPES.OTHER,
      authorId: req.user.id,
    });
    res.send(newImagingRequest);
  }),
);

const globalImagingRequests = permissionCheckingRouter('list', 'ImagingRequest');

// Route used on ImagingRequestsTable component
globalImagingRequests.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, query } = req;
    const { order = 'ASC', orderBy, rowsPerPage = 10, page = 0, ...filterParams } = query;

    // Model filters for Sequelize 'where' clauses
    const imagingTypeFilters = mapQueryFilters(filterParams, [
      {
        key: 'imagingType',
        alias: 'name',
        operator: Op.startsWith,
        mapFn: caseInsensitiveFilter,
      },
    ]);
    const patientFilters = mapQueryFilters(filterParams, [
      { key: 'firstName', operator: Op.startsWith, mapFn: caseInsensitiveFilter },
      { key: 'lastName', operator: Op.startsWith, mapFn: caseInsensitiveFilter },
      { key: 'displayId', operator: Op.startsWith, mapFn: caseInsensitiveFilter },
    ]);
    const imagingRequestFilters = mapQueryFilters(filterParams, [
      {
        key: 'requestId',
        alias: 'id',
        operator: Op.startsWith,
        mapFn: caseInsensitiveFilter,
      },
      { key: 'status', operator: Op.eq },
      {
        key: 'urgency',
        alias: 'urgent',
        operator: Op.eq,
        mapFn: urgencyTextToBooleanFilter,
      },
      { key: 'requestedDateFrom', alias: 'requestedDate', operator: Op.gte },
      { key: 'requestedDateTo', alias: 'requestedDate', operator: Op.lte },
    ]);

    // Associations to include on query
    const requestedBy = {
      association: 'requestedBy',
    };
    const imagingType = {
      association: 'imagingType',
      where: imagingTypeFilters,
    };
    const patient = {
      association: 'patient',
      where: patientFilters,
    };
    const encounter = {
      association: 'encounter',
      include: [patient],
      required: true,
    };

    // Query database
    const databaseResponse = await models.ImagingRequest.findAndCountAll({
      where: imagingRequestFilters,
      order: orderBy ? [[orderBy, order.toUpperCase()]] : undefined,
      include: [requestedBy, imagingType, encounter],
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    });

    // Extract and normalize data calling a base model method
    const count = databaseResponse.count;
    const rows = databaseResponse.rows;
    const data = rows.map(x => x.forResponse());

    res.send({
      count: count,
      data: data,
    });
  }),
);
imagingRequest.use(globalImagingRequests);
