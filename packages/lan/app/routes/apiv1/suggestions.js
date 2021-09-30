import { pascal } from 'case';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { NotFoundError } from 'shared/errors';

import { REFERENCE_TYPE_VALUES } from 'shared/constants';

export const suggestions = express.Router();

const defaultMapper = ({ name, code, id }) => ({ name, code, id });

const defaultLimit = 10;

// Add a new suggester for a particular model at the given endpoint.
// Records will be filtered based on the whereSql parameter. The user's search term
// will be passed to the sql query as ":search" - see the existing suggestion
// endpoints for usage examples.
function createSuggester(endpoint, modelName, whereSql, mapper = defaultMapper) {
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

  suggestions.get(
    `/${endpoint}`,
    asyncHandler(async (req, res) => {
      req.checkPermission('list', modelName);
      const { models, query } = req;
      const search = (query.q || '').trim().toLowerCase();
      if (!search) {
        res.send([]);
        return;
      }

      const model = models[modelName];
      const sequelize = model.sequelize;
      const results = await sequelize.query(
        `
      SELECT *
      FROM "${model.tableName}"
      WHERE ${whereSql}
      LIMIT :limit
    `,
        {
          replacements: {
            search: `%${search}%`,
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

const createNameSuggester = (endpoint, modelName = pascal(endpoint)) =>
  createSuggester(endpoint, modelName, 'LOWER(name) LIKE LOWER(:search)', ({ id, name }) => ({
    id,
    name,
  }));

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
  'practitioner',
  'User',
  'LOWER(display_name) LIKE LOWER(:search)',
  ({ id, displayName }) => ({
    id,
    name: displayName,
  }),
);

createSuggester(
  'patient',
  'Patient',
  'LOWER(first_name) LIKE LOWER(:search) OR LOWER(first_name) LIKE LOWER(:search) OR LOWER(last_name) LIKE LOWER(:search) OR LOWER(cultural_name) LIKE LOWER(:search)',
  patient => patient,
);
