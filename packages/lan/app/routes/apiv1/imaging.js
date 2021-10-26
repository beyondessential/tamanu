import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import {
  mapQueryFilters,
  getCaseInsensitiveFilter,
  getTextToBooleanFilter
} from '../../database/utils';

import {
  simpleGet,
  simplePut,
  simplePost,
  permissionCheckingRouter,
} from './crudHelpers';

// Object used to map field names to database column names
const SNAKE_CASE_COLUMN_NAMES = {
  firstName: 'first_name',
  lastName: 'last_name',
  displayId: 'display_id',
  id: 'ImagingRequest.id',
  name: 'name'
};

// Filtering functions for sequelize queries
const caseInsensitiveFilter = getCaseInsensitiveFilter(SNAKE_CASE_COLUMN_NAMES);
const urgencyTextToBooleanFilter = getTextToBooleanFilter('urgent');

export const imagingRequest = express.Router();

imagingRequest.get('/:id', simpleGet('ImagingRequest'));
imagingRequest.put('/:id', simplePut('ImagingRequest'));
imagingRequest.post('/$', simplePost('ImagingRequest'));

const globalImagingRequests = permissionCheckingRouter('list', 'ImagingRequest');

// Route used on ImagingRequestsTable component
globalImagingRequests.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, query } = req;
    const { order = 'ASC', orderBy, rowsPerPage = 10, page = 0, ...filterParams } = query;

    // Model filters for Sequelize 'where' clauses
    const imagingTypeFilters = mapQueryFilters(
      filterParams,
      [
        {
          key: 'imagingType',
          alias: 'name',
          operator: Op.startsWith,
          mapFn: caseInsensitiveFilter
        }
      ]
    );
    const patientFilters = mapQueryFilters(
      filterParams,
      [
        {key: 'firstName', operator: Op.startsWith, mapFn: caseInsensitiveFilter},
        {key: 'lastName', operator: Op.startsWith, mapFn: caseInsensitiveFilter},
        {key: 'displayId', operator: Op.startsWith, mapFn: caseInsensitiveFilter}
      ]
    );
    const imagingRequestFilters = mapQueryFilters(
      filterParams,
      [
        {
          key: 'requestId',
          alias: 'id',
          operator: Op.startsWith,
          mapFn: caseInsensitiveFilter
        },
        {key: 'status', operator: Op.eq},
        {
          key: 'urgency',
          alias: 'urgent',
          operator: Op.eq,
          mapFn: urgencyTextToBooleanFilter
        },
        {key: 'requestedDateFrom', alias: 'requestedDate', operator: Op.gte},
        {key: 'requestedDateTo', alias: 'requestedDate', operator: Op.lte}
      ]
    );

    // Associations to include on query
    const requestedBy = {
      association: 'requestedBy'
    };
    const imagingType = {
      association: 'imagingType',
      where: imagingTypeFilters
    };
    const patient = {
      association: 'patient',
      where: patientFilters
    };
    const encounter = { 
      association: 'encounter',
      include: [patient],
      required: true
    };

    // Query database
    const objects = await models['ImagingRequest'].findAll({
      where: imagingRequestFilters,
      order: orderBy ? [[orderBy, order.toUpperCase()]] : undefined,
      include: [requestedBy, imagingType, encounter],
    });

    // Normalize data calling a base model method
    const data = objects.map(x => x.forResponse());

    res.send({
      count: objects.length,
      data: data,
    });
  })
);
imagingRequest.use(globalImagingRequests);
