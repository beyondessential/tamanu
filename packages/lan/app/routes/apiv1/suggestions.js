import express from 'express';
import { Op } from 'sequelize';

import { checkPermission } from 'lan/app/controllers/auth/permission';
import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const suggestions = express.Router();

// suggestions don't need permissions checking
suggestions.use(checkPermission(null));

function simpleSuggester(modelName, searchField) {
  const limit = 10;

  return async (req, res) => {
    const { models, query } = req;
    const search = (query.q || '').trim().toLowerCase();
    if(!search) {
      res.send([]);
      return;
    }

    const results = await models[modelName].findAll({ 
      where: {
        [searchField]: {
          [Op.like]: `%${search}%`,
        },
      },
      limit,
    });

    const listing = results.map(x => ({
      value: x.id,
      label: x[searchField],
    }));
    res.send(listing);
  };
}

suggestions.get('/icd10', simpleSuggester(
  'ReferenceData', 
  'name',
  ({ name, code, id }) => ({ name, code, id }),
));

