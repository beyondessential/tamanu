import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { NOTE_TYPES } from 'shared/constants';
import { NotFoundError } from 'shared/errors';
import {
  getNoteWithType,
  mapQueryFilters,
  getCaseInsensitiveFilter,
  getTextToBooleanFilter,
} from '../../database/utils';
import { permissionCheckingRouter } from './crudHelpers';

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
      models: { ImagingRequest },
      params: { id },
    } = req;
    req.checkPermission('read', 'ImagingRequest');
    const imagingRequestObject = await ImagingRequest.findByPk(id, {
      include: ImagingRequest.getFullReferenceAssociations(),
    });
    if (!imagingRequestObject) throw new NotFoundError();

    // Get related notes (general, area to be imaged)
    const relatedNotes = await imagingRequestObject.getNotes();

    // Extract note content if note exists, else default content to empty string
    const noteContent = getNoteWithType(relatedNotes, NOTE_TYPES.OTHER)?.content || '';
    const areaNoteContent =
      getNoteWithType(relatedNotes, NOTE_TYPES.AREA_TO_BE_IMAGED)?.content || '';

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...imagingRequestObject.forResponse(),
      note: noteContent,
      areaToBeImaged: areaNoteContent,
    };

    res.send(responseObject);
  }),
);

imagingRequest.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      models: { ImagingRequest },
      params: { id },
    } = req;
    req.checkPermission('read', 'ImagingRequest');
    const imagingRequestObject = await ImagingRequest.findByPk(id);
    if (!imagingRequestObject) throw new NotFoundError();
    req.checkPermission('write', 'ImagingRequest');
    await imagingRequestObject.update(req.body);
    console.log(JSON.stringify(req.body));

    // Get related notes (general, area to be imaged)
    const relatedNotes = await imagingRequestObject.getNotes();

    // Get separate note objects
    const noteObject = getNoteWithType(relatedNotes, NOTE_TYPES.OTHER);
    const areaNoteObject = getNoteWithType(relatedNotes, NOTE_TYPES.AREA_TO_BE_IMAGED);

    // The returned note content will read its value depending if
    // note exists or gets created, else it should be an empty string
    let noteContent = '';
    let areaNoteContent = '';

    // Update the content of the note object if it exists
    if (noteObject) {
      await noteObject.update({ content: req.body.note });
      noteContent = noteObject.content;
    }
    // Else, create a new one only if it has content
    else if (req.body.note) {
      const newNoteObject = await await imagingRequestObject.addRelatedNote(
        NOTE_TYPES.OTHER,
        req.body.note,
        req.user.id,
      );
      noteContent = newNoteObject.content;
    }

    // Update the content of the area to be imaged note object if it exists
    if (areaNoteObject) {
      await areaNoteObject.update({ content: req.body.areaToBeImaged });
      areaNoteContent = areaNoteObject.content;
    }
    // Else, create a new one only if it has content
    else if (req.body.areaToBeImaged) {
      const newAreaNoteObject = await imagingRequestObject.addRelatedNote(
        NOTE_TYPES.AREA_TO_BE_IMAGED,
        req.body.areaToBeImaged,
        req.user.id,
      );
      areaNoteContent = newAreaNoteObject.content;
    }

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...imagingRequestObject.forResponse(),
      note: noteContent,
      areaToBeImaged: areaNoteContent,
    };

    res.send(responseObject);
  }),
);

imagingRequest.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { ImagingRequest },
    } = req;
    req.checkPermission('create', 'ImagingRequest');
    const newImagingRequest = await ImagingRequest.create(req.body);

    // Return notes content or empty string with the response for consistency
    let noteContent = '';
    let areaNoteContent = '';

    // Only create a note if it has content
    if (req.body.note) {
      const newNote = await newImagingRequest.addRelatedNote(
        NOTE_TYPES.OTHER,
        req.body.note,
        req.user.id,
      );

      // Update note content for response with saved data
      noteContent = newNote.content;
    }

    // Only create an area to be imaged note if it has content
    if (req.body.areaToBeImaged) {
      const newAreaNote = await newImagingRequest.addRelatedNote(
        NOTE_TYPES.AREA_TO_BE_IMAGED,
        req.body.areaToBeImaged,
        req.user.id,
      );

      // Update area to be imaged content for response with saved data
      areaNoteContent = newAreaNote.content;
    }

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...newImagingRequest.forResponse(),
      note: noteContent,
      areaToBeImaged: areaNoteContent,
    };

    res.send(responseObject);
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
