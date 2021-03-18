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

REFERENCE_TYPE_VALUES.map(typeName =>
  createSuggester(typeName, 'ReferenceData', `name ILIKE :search AND type = '${typeName}'`),
);

createSuggester('practitioner', 'User', 'display_name ILIKE :search', ({ id, displayName }) => ({
  id,
  name: displayName,
}));
