import express from 'express';
import { QueryTypes } from 'sequelize';

import { checkPermission } from 'lan/app/controllers/auth/permission';

export const suggestions = express.Router();

// suggestions don't need permissions checking
suggestions.use(checkPermission(null));

const defaultMapper = ({ name, code, id }) => ({ name, code, id });

function simpleSuggester(modelName, whereSql, mapper = defaultMapper) {
  const limit = 10;

  return async (req, res) => {
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
      FROM :tableName
      WHERE ${whereSql}
      LIMIT :limit
    `,
      {
        replacements: {
          tableName: model.tableName,
          search: `%${search}%`,
          limit,
        },
        type: QueryTypes.SELECT,
        model,
      },
    );

    const listing = results.map(mapper);
    res.send(listing);
  };
}

suggestions.get('/icd10', simpleSuggester(
  'ReferenceData', 
  `name LIKE :search AND type = 'icd10'`,
));

suggestions.get('/drug', simpleSuggester(
  'ReferenceData', 
  `name LIKE :search AND type = 'drug'`,
));


