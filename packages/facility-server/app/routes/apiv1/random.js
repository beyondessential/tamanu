import { InvalidParameterError, NotFoundError } from '@tamanu/errors';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

const WHITELISTED_ENTITIES = {
  patient: 'Patient',
  facility: 'Facility',
  location: 'Location',
  locationGroup: 'LocationGroup',
  program: 'Program',
  programRegistry: 'ProgramRegistry',
  department: 'Department',
};

/**
 * Random record API (tests / synthetic load only).
 *
 * - `where`: URL-encoded JSON object merged into the Sequelize query.
 * - `include`: URL-encoded JSON array; `"model": "Encounter"` strings are resolved to `models[model]`.
 */

function parseOptionalJsonObject(raw, paramName) {
  if (raw == null || raw === '') {
    return null;
  }
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new InvalidParameterError(`${paramName} must be a JSON object`);
    }
    return parsed;
  } catch (e) {
    if (e instanceof InvalidParameterError) {
      throw e;
    }
    throw new InvalidParameterError(`${paramName}: invalid JSON`);
  }
}

function parseOptionalJsonArray(raw, paramName) {
  if (raw == null || raw === '') {
    return null;
  }
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) {
      throw new InvalidParameterError(`${paramName} must be a JSON array`);
    }
    return parsed;
  } catch (e) {
    if (e instanceof InvalidParameterError) {
      throw e;
    }
    throw new InvalidParameterError(`${paramName}: invalid JSON`);
  }
}

/** Replace string `model` keys with Sequelize model classes (JSON cannot carry class refs). */
function resolveIncludeModelStrings(includeList, models) {
  if (!includeList?.length) {
    return;
  }
  for (const item of includeList) {
    if (typeof item.model === 'string') {
      const resolved = models[item.model];
      if (!resolved) {
        throw new InvalidParameterError(`include: no model registered as "${item.model}"`);
      }
      item.model = resolved;
    }
    if (item.include?.length) {
      resolveIncludeModelStrings(item.include, models);
    }
  }
}

function buildRandomRecordQuery(baseWhere, clientWhere, clientInclude) {
  const include = clientInclude?.length ? [...clientInclude] : [];
  const whereParts = [];

  if (Object.keys(baseWhere).length > 0) {
    whereParts.push(baseWhere);
  }
  if (clientWhere && Object.keys(clientWhere).length > 0) {
    whereParts.push(clientWhere);
  }

  const where =
    whereParts.length === 0 ? {} : whereParts.length === 1 ? whereParts[0] : { [Op.and]: whereParts };

  return { where, include };
}

export const random = express.Router();

random.get(
  '/:entity',
  asyncHandler(async (req, res) => {
    const { entity } = req.params;
    const modelName = WHITELISTED_ENTITIES[entity];

    if (!modelName) {
      throw new NotFoundError('Invalid entity');
    }

    req.checkPermission('read', modelName);

    const { models, facilityId } = req;
    const model = models[modelName];

    const baseWhere =
      facilityId && model.rawAttributes.facilityId ? { facilityId } : {};

    const clientWhere = parseOptionalJsonObject(req.query.where, 'where');
    const clientInclude = parseOptionalJsonArray(req.query.include, 'include');
    resolveIncludeModelStrings(clientInclude, models);

    const { where, include } = buildRandomRecordQuery(baseWhere, clientWhere, clientInclude);

    const queryBase = {
      where,
      include,
      subQuery: false,
    };

    const countOptions =
      include.length > 0
        ? {
            ...queryBase,
            distinct: true,
            col: model.primaryKeyAttribute,
          }
        : queryBase;

    const count = await model.count(countOptions);
    if (count === 0) {
      throw new NotFoundError('No record found');
    }

    const offset = Math.floor(Math.random() * count);
    const record = await model.findOne({
      ...queryBase,
      offset,
    });

    res.send(record);
  }),
);
