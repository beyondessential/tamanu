import { pascal } from 'case';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { NotFoundError } from 'shared/errors';
import { SURVEY_TYPES, REFERENCE_TYPE_VALUES, INVOICE_LINE_TYPES } from 'shared/constants';

export const suggestions = express.Router();

const defaultLimit = 25;

const defaultMapper = ({ name, code, id }) => ({ name, code, id });

function createSuggesterRoute(
  endpoint,
  modelName,
  whereSql,
  mapper = defaultMapper,
  searchColumn = 'name',
) {
  suggestions.get(
    `/${endpoint}`,
    asyncHandler(async (req, res) => {
      req.checkPermission('list', modelName);
      const { models, query } = req;
      const searchQuery = (query.q || '').trim().toLowerCase();

      const model = models[modelName];

      // TODO: when removing support for sqlite, just move
      // the postgres half of this into the main query
      const { dialect } = model.sequelize.options;
      const positionQuery =
        dialect === 'sqlite'
          ? `INSTR(LOWER(${searchColumn}), LOWER(:positionMatch)) > 1`
          : `POSITION(LOWER(:positionMatch) in LOWER(${searchColumn})) > 1`;

      const results = await model.sequelize.query(
        `
          SELECT *
          FROM "${model.tableName}"
          WHERE ${whereSql}
          ORDER BY
            ${positionQuery},
            ${searchColumn}
          LIMIT :limit
        `,
        {
          replacements: {
            search: `%${searchQuery}%`,
            positionMatch: searchQuery,
            limit: defaultLimit,
          },
          type: QueryTypes.SELECT,
          model,
          mapToModel: true,
        },
      );

      res.send(results.map(mapper));
    }),
  );
}

// this exists so a control can look up the associated information of a given suggester endpoint
// when it's already been given an id so that it's guaranteed to have the same structure as the
// options endpoint
function createSuggesterLookupRoute(endpoint, modelName, whereSql, mapper = defaultMapper) {
  suggestions.get(
    `/${endpoint}/:id`,
    asyncHandler(async (req, res) => {
      const { models, params } = req;
      req.checkPermission('list', modelName);
      const record = await models[modelName].findByPk(params.id);
      if (!record) throw new NotFoundError();
      req.checkPermission('read', record);
      res.send(mapper(record));
    }),
  );
}

function createAllRecordsSuggesterRoute(endpoint, modelName, whereSql, mapper = defaultMapper) {
  suggestions.get(
    `/${endpoint}/all`,
    asyncHandler(async (req, res) => {
      req.checkPermission('list', modelName);
      const { models } = req;
      const model = models[modelName];
      const results = await model.sequelize.query(
        `
      SELECT *
      FROM "${model.tableName}"
      WHERE ${whereSql}
      LIMIT :limit
    `,
        {
          replacements: {
            limit: defaultLimit,
          },
          type: QueryTypes.SELECT,
          model,
          mapToModel: true,
        },
      );

      const listing = results.map(mapper);
      res.send(listing);
    }),
  );
}

// Add a new suggester for a particular model at the given endpoint.
// Records will be filtered based on the whereSql parameter. The user's search term
// will be passed to the sql query as ":search" - see the existing suggestion
// endpoints for usage examples.
function createSuggester(endpoint, modelName, whereSql, mapper, searchColumn) {
  createSuggesterLookupRoute(endpoint, modelName, whereSql, mapper);
  createSuggesterRoute(endpoint, modelName, whereSql, mapper, searchColumn);
}

const createNameSuggester = (endpoint, modelName = pascal(endpoint)) =>
  createSuggester(endpoint, modelName, 'LOWER(name) LIKE LOWER(:search)', ({ id, name }) => ({
    id,
    name,
  }));

REFERENCE_TYPE_VALUES.map(typeName =>
  createAllRecordsSuggesterRoute(typeName, 'ReferenceData', `type = '${typeName}'`),
);

REFERENCE_TYPE_VALUES.map(typeName =>
  createSuggester(
    typeName,
    'ReferenceData',
    `LOWER(name) LIKE LOWER(:search) AND type = '${typeName}'`,
  ),
);

createNameSuggester('department');
createNameSuggester('location');
createNameSuggester('facility');

createSuggester(
  'survey',
  'Survey',
  `LOWER(name) LIKE LOWER(:search) AND survey_type <> '${SURVEY_TYPES.OBSOLETE}'`,
  ({ id, name }) => ({ id, name }),
);

createSuggester(
  'invoiceLineTypes',
  'InvoiceLineType',
  `LOWER(name) LIKE LOWER(:search) AND item_type = '${INVOICE_LINE_TYPES.ADDITIONAL}'`,
  ({ id, name, price }) => ({ id, name, price }),
);

createSuggester(
  'practitioner',
  'User',
  'LOWER(display_name) LIKE LOWER(:search)',
  ({ id, displayName }) => ({
    id,
    name: displayName,
  }),
  'display_name',
);

createSuggester(
  'patient',
  'Patient',
  "LOWER(first_name || ' ' || last_name) LIKE LOWER(:search) OR LOWER(display_id) LIKE LOWER(:search)",
  patient => patient,
  'first_name',
);
