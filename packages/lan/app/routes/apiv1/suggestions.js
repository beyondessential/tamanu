import express from 'express';
import { QueryTypes } from 'sequelize';

export const suggestions = express.Router();

const defaultMapper = ({ name, code, id }) => ({ name, code, id });

function simpleSuggester(modelName, whereSql, mapper = defaultMapper) {
  const limit = 10;

  return async (req, res) => {
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
      },
    );

    const listing = results.map(mapper);
    res.send(listing);
  };
}

const referenceDataSuggester = type =>
  simpleSuggester('ReferenceData', `name LIKE :search AND type = '${type}'`);

suggestions.get('/icd10', referenceDataSuggester('icd10'));
suggestions.get('/drug', referenceDataSuggester('drug'));
suggestions.get('/department', referenceDataSuggester('department'));
suggestions.get('/location', referenceDataSuggester('location'));

suggestions.get(
  '/practitioner',
  simpleSuggester('User', `display_name LIKE :search`, ({ id, display_name }) => ({
    id,
    name: display_name,
  })),
);
