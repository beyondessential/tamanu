import express from 'express';
import asyncHandler from 'express-async-handler';
import moment from 'moment';
import { Op } from 'sequelize';
import { NOTE_TYPES, AREA_TYPE_TO_IMAGING_TYPE, IMAGING_AREA_TYPES } from 'shared/constants';
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
  '/areas$',
  asyncHandler(async (req, res) => {
    const {
      models: { ReferenceData },
      flagPermissionChecked,
    } = req;
    // always allow reading imaging area options
    flagPermissionChecked();

    const records = await ReferenceData.findAll({
      where: {
        type: Object.values(IMAGING_AREA_TYPES),
      },
    });
    // Key areas by imagingType
    const areas = records.reduce((acc, record) => {
      const imagingType = AREA_TYPE_TO_IMAGING_TYPE[record.type];
      return {
        ...acc,
        [imagingType]: [...(acc[imagingType] || []), record.forResponse()],
      };
    }, {});
    res.send(areas);
  }),
);

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

    // Free text area content fallback
    const areaNoteContent =
      getNoteWithType(relatedNotes, NOTE_TYPES.AREA_TO_BE_IMAGED)?.content || '';

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...imagingRequestObject.get({ plain: true }),
      note: noteContent,
      areaNote: areaNoteContent,
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
    const { areas, areaNote, ...imagingRequestData } = req.body;

    await imagingRequestObject.update(imagingRequestData);

    // Updates the reference data associations for the areas to be imaged
    if (areas) {
      await imagingRequestObject.setAreas(areas.split(/,\s/));
    }

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
      const newNoteObject = await imagingRequestObject.createNote({
        type: NOTE_TYPES.OTHER,
        content: req.body.note,
        authorId: req.user.id,
      });
      noteContent = newNoteObject.content;
    }

    // Update the content of the area to be imaged note object if it exists
    if (areaNoteObject) {
      await areaNoteObject.update({ content: req.body.areaNote });
      areaNoteContent = areaNoteObject.content;
    }
    // Else, create a new one only if it has content
    else if (req.body.areaNote) {
      const newAreaNoteObject = await imagingRequestObject.createNote({
        type: NOTE_TYPES.AREA_TO_BE_IMAGED,
        content: req.body.areaNote,
        authorId: req.user.id,
      });
      areaNoteContent = newAreaNoteObject.content;
    }

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...imagingRequestObject.get({ plain: true }),
      note: noteContent,
      // Fallback free text area notes
      areaNote: areaNoteContent,
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
    const { areas, areaNote, ...imagingRequestData } = req.body;

    const newImagingRequest = await ImagingRequest.create(imagingRequestData);

    // Creates the reference data associations for the areas to be imaged
    if (areas) {
      await newImagingRequest.setAreas(areas.split(/,\s/));
    }

    // Return notes content or empty string with the response for consistency
    let noteContent = '';
    let areaNoteContent = '';

    // Only create a note if it has content
    if (req.body.note) {
      const newNote = await newImagingRequest.createNote({
        type: NOTE_TYPES.OTHER,
        content: req.body.note,
        authorId: req.user.id,
      });

      // Update note content for response with saved data
      noteContent = newNote.content;
    }

    // Only create an area to be imaged note if it has content
    if (req.body.areaNote) {
      const newAreaNote = await newImagingRequest.createNote({
        type: NOTE_TYPES.AREA_TO_BE_IMAGED,
        content: req.body.areaNote,
        authorId: req.user.id,
      });

      // Update area to be imaged content for response with saved data
      areaNoteContent = newAreaNote.content;
    }

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...newImagingRequest.get({ plain: true }),
      note: noteContent,
      areaNote: areaNoteContent,
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
      { key: 'imagingType', operator: Op.eq },
      { key: 'status', operator: Op.eq },
      {
        key: 'urgency',
        alias: 'urgent',
        operator: Op.eq,
        mapFn: urgencyTextToBooleanFilter,
      },
      {
        key: 'requestedDateFrom',
        alias: 'requestedDate',
        operator: Op.gte,
        mapFn: (fieldName, operator, value) => ({
          [fieldName]: {
            [operator]: moment(value)
              .startOf('day')
              .toISOString(),
          },
        }),
      },
      {
        key: 'requestedDateTo',
        alias: 'requestedDate',
        operator: Op.lte,
        mapFn: (fieldName, operator, value) => ({
          [fieldName]: {
            [operator]: moment(value)
              .endOf('day')
              .toISOString(),
          },
        }),
      },
    ]);

    // Associations to include on query
    const requestedBy = {
      association: 'requestedBy',
    };
    const areas = {
      association: 'areas',
      through: {
        // Don't include attributes on through table
        attributes: [],
      },
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
      include: [requestedBy, encounter, areas],
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    });

    // Extract and normalize data calling a base model method
    const { count } = databaseResponse;
    const { rows } = databaseResponse;

    const data = rows.map(x => x.get({ plain: true }));
    res.send({
      count,
      data,
    });
  }),
);

imagingRequest.use(globalImagingRequests);
