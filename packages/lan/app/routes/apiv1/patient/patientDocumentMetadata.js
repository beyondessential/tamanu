import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { DOCUMENT_SIZE_LIMIT } from '@tamanu/constants';
import { NotFoundError } from 'shared/errors';
import { uploadAttachment } from '../../../utils/uploadAttachment';
import { mapQueryFilters, getCaseInsensitiveFilter, getOrderClause } from '../../../database/utils';
import { createPatientLetter } from '../../../routeHandlers/createPatientLetter';

// Object used to map field names to database column names
const SNAKE_CASE_COLUMN_NAMES = {
  type: 'type',
  documentOwner: 'document_owner',
  name: 'department.name',
};

// Filtering functions for sequelize queries
const caseInsensitiveFilter = getCaseInsensitiveFilter(SNAKE_CASE_COLUMN_NAMES);

export const patientDocumentMetadataRoutes = express.Router();

// Route used on DocumentsTable component
patientDocumentMetadataRoutes.get(
  '/:id/documentMetadata',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'DocumentMetadata');
    req.checkPermission('list', 'Encounter');

    const { models, params, query } = req;
    const { order = 'ASC', orderBy, rowsPerPage = 10, page = 0, offset, ...filterParams } = query;

    // Get all encounter IDs for this patient
    const patientId = params.id;
    const patientEncounters = await models.Encounter.findAll({
      where: {
        patientId,
      },
      attributes: ['id'],
    });

    // Convert into an array of strings for querying
    const encounterIds = patientEncounters.map(obj => obj.id);

    // Create filters
    const documentFilters = mapQueryFilters(filterParams, [
      { key: 'type', operator: Op.substring, mapFn: caseInsensitiveFilter },
      { key: 'documentOwner', operator: Op.startsWith, mapFn: caseInsensitiveFilter },
    ]);
    const departmentFilters = mapQueryFilters(filterParams, [
      {
        key: 'departmentName',
        alias: 'name',
        operator: Op.startsWith,
        mapFn: caseInsensitiveFilter,
      },
    ]);

    // Require it when search has field, otherwise documents
    // without a specified department won't appear
    const departmentInclude = {
      association: 'department',
      where: departmentFilters,
      required: (filterParams.departmentName && true) || false,
    };

    // Get all document metadata associated with the patient or any encounter
    // that the patient may have had. Also apply filters from search bar.
    const documentMetadataItems = await models.DocumentMetadata.findAndCountAll({
      where: {
        [Op.and]: [
          { [Op.or]: [{ patientId }, { encounterId: { [Op.in]: encounterIds } }] },
          documentFilters,
        ],
      },
      order: orderBy ? getOrderClause(order, orderBy) : undefined,
      include: [departmentInclude],
      limit: rowsPerPage,
      offset: offset || page * rowsPerPage,
    });

    res.send({
      data: documentMetadataItems.rows,
      count: documentMetadataItems.count,
    });
  }),
);

patientDocumentMetadataRoutes.post(
  '/:id/documentMetadata',
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    // TODO: Figure out permissions with Attachment and DocumentMetadata.
    // Presumably, they should be the same as they depend on each other.
    // After it has been figured out, modify the POST /documentMetadata route
    // inside encounter.js and also /createPatientLetter.
    req.checkPermission('write', 'DocumentMetadata');

    // Make sure the specified patient exists
    const patient = await models.Patient.findByPk(params.id);
    if (!patient) {
      throw new NotFoundError();
    }

    // Create file on the sync server
    const { attachmentId, type, metadata } = await uploadAttachment(req, DOCUMENT_SIZE_LIMIT);

    const documentMetadataObject = await models.DocumentMetadata.create({
      ...metadata,
      attachmentId,
      type,
      patientId: params.id,
      documentUploadedAt: getCurrentDateTimeString(),
      source: DOCUMENT_SOURCES.UPLOADED,
    });

    res.send(documentMetadataObject);
  }),
);

patientDocumentMetadataRoutes.post(
  '/:id/createPatientLetter',
  createPatientLetter('Patient', 'patientId'),
);
