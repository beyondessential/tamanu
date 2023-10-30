import express from 'express';
import config from 'config';
import asyncHandler from 'express-async-handler';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op, literal } from 'sequelize';
import {
  NOTE_TYPES,
  AREA_TYPE_TO_IMAGING_TYPE,
  IMAGING_AREA_TYPES,
  IMAGING_REQUEST_STATUS_TYPES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { NotFoundError } from '@tamanu/shared/errors';
import { permissionCheckingRouter } from '@tamanu/shared/utils/crudHelpers';
import { toDateTimeString, toDateString } from '@tamanu/shared/utils/dateTime';
import { getNoteWithType } from '@tamanu/shared/utils/notes';
import { mapQueryFilters } from '../../database/utils';
import { getImagingProvider } from '../../integrations/imaging';

async function renderResults(context, imagingRequest) {
  const results = imagingRequest.results
    ?.filter(result => !result.deletedAt)
    .map(result => result.get({ plain: true }));
  if (!results || results.length === 0) return results;

  const imagingProvider = await getImagingProvider(context);
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

const caseInsensitiveFilter = (fieldName, _operator, value) => ({
  [fieldName]: {
    [Op.iLike]: `%${value}%`,
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
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
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
      models,
      settings,
      params: { id },
    } = req;
    req.checkPermission('read', 'ImagingRequest');
    const { ImagingRequest, ImagingResult, User, ReferenceData } = models;
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
          association: 'notes',
        },
      ],
    });
    if (!imagingRequestObject) throw new NotFoundError();

    res.send({
      ...imagingRequestObject.get({ plain: true }),
      ...(await imagingRequestObject.extractNotes()),
      results: await renderResults({ models, settings }, imagingRequestObject),
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
      body: { areas, note, areaNote, newResult, ...imagingRequestData },
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
    const relatedNotes = await imagingRequestObject.getNotes({
      where: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    });

    const otherNote = getNoteWithType(relatedNotes, NOTE_TYPES.OTHER);
    const areaNoteObject = getNoteWithType(relatedNotes, NOTE_TYPES.AREA_TO_BE_IMAGED);

    const notes = {
      note: '',
      areaNote: '',
    };

    // Update or create the note with new content if provided
    if (note) {
      if (otherNote) {
        const newNote = `${otherNote.content}. ${note}`;
        await otherNote.update({ content: newNote });
        notes.note = otherNote.content;
      } else {
        const noteObject = await imagingRequestObject.createNote({
          noteType: NOTE_TYPES.OTHER,
          content: note,
          authorId: user.id,
        });
        notes.note = noteObject.content;
      }
    }

    // Update or create the imaging areas note with new content if provided
    if (areaNote) {
      if (areaNoteObject) {
        await areaNoteObject.update({ content: areaNote });
        notes.areaNote = areaNote.content || '';
      } else {
        const noteObject = await imagingRequestObject.createNote({
          noteType: NOTE_TYPES.AREA_TO_BE_IMAGED,
          content: areaNote,
          authorId: user.id,
        });
        notes.areaNote = noteObject.content;
      }
    }

    if (newResult?.completedAt) {
      const imagingResult = await ImagingResult.create({
        ...newResult,
        imagingRequestId: imagingRequestObject.id,
      });

      if (imagingRequestObject.results) {
        imagingRequestObject.results.push(imagingResult);
      } else {
        imagingRequestObject.results = [imagingResult];
      }
    }

    const { models, settings } = req;

    res.send({
      ...imagingRequestObject.get({ plain: true }),
      ...notes,
      results: await renderResults({ models, settings }, imagingRequestObject),
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
        const noteObject = await newImagingRequest.createNote({
          noteType: NOTE_TYPES.OTHER,
          content: note,
          authorId: user.id,
        });
        notes.note = noteObject.content;
      }

      if (areaNote) {
        const noteObject = await newImagingRequest.createNote({
          noteType: NOTE_TYPES.AREA_TO_BE_IMAGED,
          content: areaNote,
          authorId: user.id,
        });
        notes.areaNote = noteObject.content;
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

    const orderDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const nullPosition =
      orderBy === 'completedAt' && (orderDirection === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST');

    const patientFilters = mapQueryFilters(filterParams, [
      { key: 'firstName', mapFn: caseInsensitiveStartsWithFilter },
      { key: 'lastName', mapFn: caseInsensitiveStartsWithFilter },
      { key: 'displayId', mapFn: caseInsensitiveFilter },
    ]);

    const encounterFilters = mapQueryFilters(filterParams, [
      { key: 'departmentId', operator: Op.eq },
    ]);
    const imagingRequestFilters = mapQueryFilters(filterParams, [
      {
        key: 'requestId',
        alias: 'displayId',
        mapFn: caseInsensitiveStartsWithFilter,
      },
      { key: 'imagingType', operator: Op.eq },
      {
        key: 'status',
        operator: Op.in,
        mapFn: (fieldName, operator, value) => ({
          [fieldName]: {
            [operator]: Array.isArray(value) ? value : [value],
          },
        }),
      },
      { key: 'priority', operator: Op.eq },
      { key: 'locationGroupId', operator: Op.eq },
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
      { key: 'requestedById', operator: Op.eq },
    ]);

    // Associations to include on query
    const requestedBy = {
      association: 'requestedBy',
    };
    const patient = {
      association: 'patient',
      where: patientFilters,
      attributes: ['displayId', 'firstName', 'lastName', 'id'],
    };

    const locationWhere = {
      where:
        filterParams?.allFacilities && JSON.parse(filterParams.allFacilities)
          ? {}
          : { facilityId: { [Op.eq]: config.serverFacilityId } },
    };

    const location = {
      association: 'location',
      ...locationWhere,
    };

    const encounter = {
      association: 'encounter',
      where: encounterFilters,
      include: [patient, location],
      attributes: ['id', 'departmentId'],
      required: true,
    };

    const imagingResultFilters = {};
    const replacements = {};

    // Sequelize does not support FROM sub query, only sub query as field
    // and alias cannot be used in where clause. So to filter by MAX(imaging_results.completed_at),
    // the sub query has to be duplicated in the where clause as well in the select part.
    if (filterParams.completedAt) {
      imagingResultFilters.id = {
        [Op.in]: literal(
          `(
            SELECT imaging_request_id FROM (SELECT imaging_request_id, MAX(completed_at)
            FROM imaging_results
            WHERE imaging_results.imaging_request_id = "ImagingRequest".id
            GROUP BY imaging_request_id
            HAVING MAX(completed_at) LIKE :completedAtFilterDate) AS max_completed_at
          )`,
        ),
      };
      replacements.completedAtFilterDate = `${toDateString(parseISO(filterParams.completedAt))}%`;
    }

    // Query database
    const databaseResponse = await models.ImagingRequest.findAndCountAll({
      where: {
        [Op.and]: {
          ...imagingRequestFilters,
          ...imagingResultFilters,
          status: {
            [Op.notIn]: [
              IMAGING_REQUEST_STATUS_TYPES.DELETED,
              IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
              IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
            ],
          },
        },
      },
      order: orderBy
        ? [[...orderBy.split('.'), `${orderDirection}${nullPosition ? ` ${nullPosition}` : ''}`]]
        : undefined,
      include: [requestedBy, encounter],
      attributes: {
        include: [
          // Aggregate results into a new field using a literal subquery. This avoids Sequelize
          // including an entry for each ImagingRequest per result & messing up the pagination
          [
            literal(`(
            SELECT MAX(completed_at)
            FROM imaging_results
            WHERE imaging_results.imaging_request_id = "ImagingRequest".id
          )`),
            'completedAt',
          ],
        ],
      },
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      distinct: true,
      subQuery: false,
      replacements,
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
