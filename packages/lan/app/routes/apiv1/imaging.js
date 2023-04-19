import express from 'express';
import asyncHandler from 'express-async-handler';
import { startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';
import {
  NOTE_TYPES,
  AREA_TYPE_TO_IMAGING_TYPE,
  IMAGING_AREA_TYPES,
  IMAGING_REQUEST_STATUS_TYPES,
  VISIBILITY_STATUSES,
} from 'shared/constants';
import { NotFoundError } from 'shared/errors';
import { toDateTimeString } from 'shared/utils/dateTime';
import { getNoteWithType } from 'shared/utils/notePages';
import { mapQueryFilters } from '../../database/utils';
import { permissionCheckingRouter } from './crudHelpers';
import { getImagingProvider } from '../../integrations/imaging';

async function renderResults(models, imagingRequest) {
  const results = imagingRequest.results
    ?.filter(result => !result.deletedAt)
    .map(result => result.get({ plain: true }));
  if (!results || results.length === 0) return results;

  const imagingProvider = await getImagingProvider(models);
  if (imagingProvider) {
    const urls = await Promise.all(
      imagingRequest.results.map(async result => {
        // catch all errors so we never fail to show the request if the external provider errors
        try {
          const url = await imagingProvider.getUrlForResult(result);
          if (!url) return null;

          return { resultId: result.id, url };
        } catch (err) {
          return { resultId: result.id, err };
        }
      }),
    );

    for (const result of results) {
      const externalResult = urls.find(url => url?.resultId === result.id);
      if (!externalResult) continue;

      const { url, err } = externalResult;
      if (url) {
        result.externalUrl = url;
      } else {
        result.externalError = err?.toString() ?? 'Unknown error';
      }
    }
  }

  return results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

// Filtering functions for sequelize queries
const caseInsensitiveStartsWithFilter = (fieldName, _operator, value) => ({
  [fieldName]: {
    [Op.iLike]: `${value}%`,
  },
});

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
      models: { ImagingRequest, ImagingResult, User, ReferenceData },
      params: { id },
    } = req;
    req.checkPermission('read', 'ImagingRequest');
    const imagingRequestObject = await ImagingRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'requestedBy',
        },
        {
          model: ReferenceData,
          as: 'areas',
        },
        {
          model: ImagingResult,
          as: 'results',
          include: [
            {
              model: User,
              as: 'completedBy',
            },
          ],
        },
        {
          association: 'notePages',
          include: [{ association: 'noteItems' }],
        },
      ],
    });
    if (!imagingRequestObject) throw new NotFoundError();

    res.send({
      ...imagingRequestObject.get({ plain: true }),
      ...(await imagingRequestObject.extractNotes()),
      results: await renderResults(req.models, imagingRequestObject),
    });
  }),
);

imagingRequest.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      models: { ImagingRequest, ImagingResult },
      params: { id },
      user,
      body: {
        areas,
        note,
        areaNote,
        newResultCompletedBy,
        newResultDate,
        newResultDescription,
        ...imagingRequestData
      },
    } = req;
    req.checkPermission('read', 'ImagingRequest');

    const imagingRequestObject = await ImagingRequest.findByPk(id);
    if (!imagingRequestObject) throw new NotFoundError();
    req.checkPermission('write', 'ImagingRequest');

    await imagingRequestObject.update(imagingRequestData);

    // Updates the reference data associations for the areas to be imaged
    if (areas) {
      await imagingRequestObject.setAreas(areas.split(/,\s/));
    }

    // Get related notes (general, area to be imaged)
    const relatedNotePages = await imagingRequestObject.getNotePages({
      where: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    });

    const otherNotePage = getNoteWithType(relatedNotePages, NOTE_TYPES.OTHER);
    const areaNotePage = getNoteWithType(relatedNotePages, NOTE_TYPES.AREA_TO_BE_IMAGED);

    const notes = {
      note: '',
      areaNote: '',
    };

    // Update or create the note with new content if provided
    if (note) {
      if (otherNotePage) {
        const [otherNoteItem] = await otherNotePage.getNoteItems();
        const newNote = `${otherNoteItem.content}. ${note}`;
        await otherNoteItem.update({ content: newNote });
        notes.note = otherNoteItem.content;
      } else {
        const notePage = await imagingRequestObject.createNotePage({
          noteType: NOTE_TYPES.OTHER,
        });
        const noteItem = await notePage.createNoteItem({
          content: note,
          authorId: user.id,
        });
        notes.note = noteItem.content;
      }
    }

    // Update or create the imaging areas note with new content if provided
    if (areaNote) {
      if (areaNotePage) {
        const areaNoteItems = await areaNotePage.getNoteItems();
        const areaNoteItem = areaNoteItems[0];
        await areaNoteItem.update({ content: areaNote });
        notes.areaNote = areaNoteItem?.content || '';
      } else {
        const notePage = await imagingRequestObject.createNotePage({
          noteType: NOTE_TYPES.AREA_TO_BE_IMAGED,
        });
        const noteItem = await notePage.createNoteItem({
          content: areaNote,
          authorId: user.id,
        });
        notes.areaNote = noteItem.content;
      }
    }

    if (newResultDescription?.length > 0) {
      const newResult = await ImagingResult.create({
        description: newResultDescription,
        completedAt: newResultDate,
        completedById: newResultCompletedBy,
        imagingRequestId: imagingRequestObject.id,
      });

      if (imagingRequestObject.results) {
        imagingRequestObject.results.push(newResult);
      } else {
        imagingRequestObject.results = [newResult];
      }
    }

    res.send({
      ...imagingRequestObject.get({ plain: true }),
      ...notes,
      results: await renderResults(req.models, imagingRequestObject),
    });
  }),
);

imagingRequest.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { ImagingRequest },
      user,
      body: { areas, note, areaNote, ...imagingRequestData },
    } = req;
    req.checkPermission('create', 'ImagingRequest');

    let newImagingRequest;
    const notes = {
      note: '',
      areaNote: '',
    };
    await ImagingRequest.sequelize.transaction(async () => {
      newImagingRequest = await ImagingRequest.create(imagingRequestData);

      // Creates the reference data associations for the areas to be imaged
      if (areas) {
        await newImagingRequest.setAreas(areas.split(/,\s/));
      }

      if (note) {
        const notePage = await newImagingRequest.createNotePage({
          noteType: NOTE_TYPES.OTHER,
        });
        const noteItem = await notePage.createNoteItem({
          content: note,
          authorId: user.id,
        });
        notes.note = noteItem.content;
      }

      if (areaNote) {
        const notePage = await newImagingRequest.createNotePage({
          noteType: NOTE_TYPES.AREA_TO_BE_IMAGED,
        });
        const noteItem = await notePage.createNoteItem({
          content: areaNote,
          authorId: user.id,
        });
        notes.areaNote = noteItem.content;
      }
    });

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...newImagingRequest.get({ plain: true }),
      ...notes,
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
      { key: 'firstName', mapFn: caseInsensitiveStartsWithFilter },
      { key: 'lastName', mapFn: caseInsensitiveStartsWithFilter },
      { key: 'displayId', mapFn: caseInsensitiveStartsWithFilter },
    ]);
    const imagingRequestFilters = mapQueryFilters(filterParams, [
      {
        key: 'requestId',
        alias: 'displayId',
        mapFn: caseInsensitiveStartsWithFilter,
      },
      { key: 'imagingType', operator: Op.eq },

      { key: 'status', operator: Op.eq },

      { key: 'priority', operator: Op.eq },
      {
        key: 'requestedDateFrom',
        alias: 'requestedDate',
        operator: Op.gte,
        mapFn: (fieldName, operator, value) => ({
          [fieldName]: {
            [operator]: toDateTimeString(startOfDay(new Date(value))),
          },
        }),
      },
      {
        key: 'requestedDateTo',
        alias: 'requestedDate',
        operator: Op.lte,
        mapFn: (fieldName, operator, value) => ({
          [fieldName]: {
            [operator]: toDateTimeString(endOfDay(new Date(value))),
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
    const results = {
      association: 'results',
    };

    // Query database
    const databaseResponse = await models.ImagingRequest.findAndCountAll({
      where: {
        [Op.and]: {
          ...imagingRequestFilters,
          status: {
            [Op.notIn]: [
              IMAGING_REQUEST_STATUS_TYPES.DELETED,
              IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
              IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
            ],
          },
        },
      },
      order: orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : undefined,
      include: [requestedBy, encounter, areas, results],
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      distinct: true,
    });

    // Extract and normalize data calling a base model method
    const { count } = databaseResponse;
    const { rows } = databaseResponse;

    const data = rows.map(row => row.get({ plain: true }));
    res.send({
      count,
      data,
    });
  }),
);

imagingRequest.use(globalImagingRequests);
