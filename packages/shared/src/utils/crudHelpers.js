import express from 'express';
import asyncHandler from 'express-async-handler';
import { pick } from 'es-toolkit/compat';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';

import { InvalidOperationError, NotFoundError, UsageError } from '@tamanu/errors';
import { renameObjectKeys } from '@tamanu/utils/renameObjectKeys';

// utility function for creating a subroute that all checks the same
// action (for eg different relation reads on an encounter all check encounter.read)
export const permissionCheckingRouter = (action, subject) => {
  const router = express.Router();

  router.use((req, res, next) => {
    req.checkPermission(action, subject);
    next();
  });

  return router;
};

export const softDeletionCheckingRouter = (tableName) => {
  const router = express.Router();

  router.use(async (req, res, next) => {
    const { models, body, params } = req;
    const id = params.id || body.id;
    if (!id) {
      next();
      return;
    }
    const object = await models[tableName].findByPk(id, { paranoid: false });
    if (object && object.deletedAt) {
      throw new InvalidOperationError(
        `Invalid Operation Error: Cannot update a deleted ${tableName}, id: ${id}.`,
      );
    }
  });

  return router;
};

export const findRouteObject = async (req, modelName, options = {}) => {
  const { models, params } = req;
  const { additionalFilters = {} } = options;
  const model = models[modelName];
  // check the user can read this model type before searching for it
  // (otherwise, they can see if they get a "not permitted" or a
  // "not found" to snoop for objects)
  req.checkPermission('read', modelName);
  const object = await model.findByPk(params.id, {
    include: model.getFullReferenceAssociations(),
    where: additionalFilters,
  });
  if (!object) {
    throw new NotFoundError(
      `No ${modelName} found with ID ${params.id} matching ${JSON.stringify(additionalFilters)}`,
    );
  }
  req.checkPermission('read', object);
  return object;
};

export const simpleGet = (modelName, options = {}) =>
  asyncHandler(async (req, res) => {
    const { auditAccess = false } = options;
    const { models, params, query } = req;

    const object = await findRouteObject(req, modelName);

    if (auditAccess && object) {
      await req.audit.access({
        recordId: object.id,
        frontEndContext: params,
        model: models[modelName],
        facilityId: query.facilityId,
      });
    }

    res.send(object);
  });

export const simpleGetHasOne = (modelName, foreignKey, options = {}, transform = undefined) =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const model = models[modelName];
    const { additionalFilters = {}, auditAccess = false } = options;
    req.checkPermission('read', modelName);
    const object = await model.findOne({
      where: { [foreignKey]: params.id, ...additionalFilters },
      include: model.getFullReferenceAssociations(),
    });
    if (!object) throw new NotFoundError();

    if (auditAccess && object) {
      await req.audit.access({
        recordId: object.id,
        frontEndContext: params,
        model: models[modelName],
      });
    }

    res.send(transform ? transform(object) : object);
  });

const conjoiner = new Intl.ListFormat();

// The database and sync layer own these, so no allowedFields option may name them and no
// request can write them.
const SYSTEM_MANAGED_FIELDS = ['createdAt', 'deletedAt', 'updatedAt', 'updatedAtSyncTick'];

// A create may carry the new record's id. An update addresses its record by URL, so naming
// the primary key there is always a mistake. Each helper's name travels with its protected
// list so the two cannot disagree between the two checks below.
const CREATE_GUARD = { helperName: 'simplePost', protectedFields: SYSTEM_MANAGED_FIELDS };
const PUT_GUARD = { helperName: 'simplePut', protectedFields: [...SYSTEM_MANAGED_FIELDS, 'id'] };
const PATCH_GUARD = {
  helperName: 'simplePatch',
  protectedFields: [...SYSTEM_MANAGED_FIELDS, 'id'],
};

// Runs while the route is being built, so a call site that forgets allowedFields or names a
// protected field fails at boot, in every environment.
function requireAllowedFields({ helperName, protectedFields }, options) {
  const { allowedFields } = options ?? {};
  if (!allowedFields || allowedFields.length === 0) {
    throw new InvalidOperationError(`${helperName} requires a nonempty allowedFields option`);
  }

  const named = allowedFields.filter(field => protectedFields.includes(field));
  if (named.length > 0) {
    const unit = named.length === 1 ? 'field' : 'fields';
    throw new UsageError(
      `${helperName} allowedFields option names protected ${unit}: ${conjoiner.format(named)}.`,
    );
  }
}

// Whether those fields exist needs the model, which is only reachable through the request.
// Left to development and CI, where a bad option is a failing test.
function validateFieldsExist({ helperName, protectedFields }, modelName, model, allowedFields) {
  const valids = new Set(Object.keys(model?.rawAttributes ?? {}));
  for (const field of protectedFields) {
    valids.delete(field);
  }

  const invalids = allowedFields.filter(field => !valids.has(field));
  if (invalids.length > 0) {
    const unit = invalids.length === 1 ? 'field' : 'fields';
    throw new UsageError(
      `${helperName} allowedFields option includes invalid ${unit} for ${modelName}: ${conjoiner.format(invalids)}. (Permitted fields: ${conjoiner.format(valids)}.)`,
    );
  }
}

async function validatePatchBody(allowedFields, req) {
  const parsed = await z
    .object(Object.fromEntries(allowedFields.map(key => [key, z.unknown()])))
    .partial()
    .strict()
    .safeParseAsync(req.body);

  if (parsed.success) return;

  const disallowed = parsed.error.issues
    .filter(issue => issue.code === 'unrecognized_keys')
    .flatMap(issue => issue.keys);
  if (disallowed.length > 0) {
    const unit = disallowed.length === 1 ? 'field' : 'fields';
    throw new InvalidOperationError(
      `PATCH body includes disallowed ${unit}: ${conjoiner.format(disallowed)}. (Allowed fields: ${conjoiner.format(allowedFields)}.)`,
    );
  }

  const [first] = parsed.error.issues;
  throw new InvalidOperationError(first?.message ?? 'Invalid PATCH body');
}

/**
 * @param {string} modelName
 * @param {{ allowedFields: string[] }} options
 */
export const simplePatch = (modelName, options) => {
  requireAllowedFields(PATCH_GUARD, options);

  return asyncHandler(async (req, res) => {
    req.checkPermission('read', modelName);

    const { allowedFields } = options;
    const {
      models: { [modelName]: model },
      params: { id },
    } = req;

    if (process.env.NODE_ENV !== 'production') {
      validateFieldsExist(PATCH_GUARD, modelName, model, allowedFields);
    }
    if (req.body == null) throw new InvalidOperationError('PATCH body is required');

    // Optimistically assume body is valid and begin fetching object before validated
    const [, object] = await Promise.all([
      validatePatchBody(allowedFields, req),
      model.findByPk(id),
    ]);

    if (!object) throw new NotFoundError(`No ${modelName} found with ID ${id}`);
    if (object.deletedAt) {
      throw new InvalidOperationError(`Cannot update deleted ${modelName} with ID ${id}`);
    }
    if (Object.hasOwn(req.body, 'deletedAt')) {
      throw new InvalidOperationError('Cannot update deletedAt field with PATCH request');
    }

    req.checkPermission('write', object);
    await object.update(pick(req.body, allowedFields));
    res.send(object);
  });
};

/**
 * Unlike simplePatch, which receives a hand-built delta and so rejects anything outside
 * allowedFields, a PUT body is the whole record the client last read: it carries the id,
 * the audit timestamps and nested association objects straight back. Those are filtered
 * out rather than refused.
 *
 * @param {string} modelName
 * @param {{ allowedFields: string[] }} options
 */
export const simplePut = (modelName, options) => {
  requireAllowedFields(PUT_GUARD, options);

  return asyncHandler(async (req, res) => {
    const { allowedFields } = options;
    const {
      models: { [modelName]: model },
      params,
    } = req;

    req.checkPermission('read', modelName);

    if (process.env.NODE_ENV !== 'production') {
      validateFieldsExist(PUT_GUARD, modelName, model, allowedFields);
    }

    const object = await model.findByPk(params.id);
    if (!object) throw new NotFoundError(`No ${modelName} found with ID ${params.id}`);
    if (object.deletedAt)
      throw new InvalidOperationError(
        `Cannot update deleted object with id (${params.id}), you need to restore it first`,
      );
    req.checkPermission('write', object);
    await object.update(pick(req.body, allowedFields));
    res.send(object);
  });
};

/**
 * Filters the body to allowedFields rather than refusing unknown keys, for the same reason
 * as simplePut. A client may supply the new record's id, so allowedFields needs to include
 * it wherever that is intended; where it does not, the id is generated and a body id is
 * ignored rather than checked for a collision.
 *
 * @param {string} modelName
 * @param {{ allowedFields: string[] }} options
 */
export const simplePost = (modelName, options) => {
  requireAllowedFields(CREATE_GUARD, options);

  return asyncHandler(async (req, res) => {
    const { allowedFields } = options;
    const {
      models: { [modelName]: model },
    } = req;

    req.checkPermission('create', modelName);

    if (process.env.NODE_ENV !== 'production') {
      validateFieldsExist(CREATE_GUARD, modelName, model, allowedFields);
    }

    const values = pick(req.body, allowedFields);
    if (values.id) {
      const existingObject = await model.findByPk(values.id, {
        paranoid: false,
      });
      if (existingObject) {
        throw new InvalidOperationError(
          `Cannot create object with id (${values.id}), it already exists`,
        );
      }
    }

    const object = await model.create(values);
    res.send(object);
  });
};

export const getResourceList = async (req, modelName, foreignKey = '', options = {}) => {
  const { models, params, query } = req;
  const { order = 'ASC', orderBy = 'createdAt', rowsPerPage, page } = query;
  const { additionalFilters = {}, include = [], skipPermissionCheck = false } = options;

  if (skipPermissionCheck === false) {
    req.checkPermission('list', modelName);
  }

  const model = models[modelName];
  const associations = model.getListReferenceAssociations(models) || [];

  const baseQueryOptions = {
    where: {
      ...(foreignKey && { [foreignKey]: params.id }),
      ...additionalFilters,
    },
    // ['association', 'column', 'direction'] is the sequlize format to sort by foreign column
    // allow 'association.column' as a valid sort query
    order: orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : undefined,
    include: [...associations, ...include],
  };

  const count = await models[modelName].count({
    ...baseQueryOptions,
    distinct: true,
  });

  const objects = await models[modelName].findAll({
    ...baseQueryOptions,
    limit: rowsPerPage,
    offset: page && rowsPerPage ? page * rowsPerPage : undefined,
  });

  const data = objects.map((x) => x.forResponse());

  return { count, data };
};

export const simpleGetList = (modelName, foreignKey = '', options = {}) =>
  asyncHandler(async (req, res) => {
    const response = await getResourceList(req, modelName, foreignKey, options);

    res.send(response);
  });

export const paginatedGetList = (modelName, foreignKey = '', options = {}) => {
  const { additionalFilters = {}, include = [], skipPermissionCheck = false } = options;

  return asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { page = 0, order = 'ASC', orderBy, rowsPerPage } = query;
    const offset = query.offset || page * rowsPerPage || 0;

    if (skipPermissionCheck === false) {
      req.checkPermission('list', modelName);
    }

    const model = models[modelName];
    const associations = model.getListReferenceAssociations(models) || [];

    const queryOpts = {
      where: {
        ...(foreignKey && { [foreignKey]: params.id }),
        ...additionalFilters,
      },
      include: [...associations, ...include],
    };

    const resultsToCount = await models[modelName].findAll(queryOpts);
    const count = resultsToCount.length;
    // Exit early if there are no results
    if (count === 0) {
      res.send({ count, data: [] });
      return;
    }

    const objects = await models[modelName].findAll({
      ...queryOpts,
      // ['association', 'column', 'direction'] is the sequlize format to sort by foreign column
      // allow 'association.column' as a valid sort query
      order: orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : undefined,
      limit: rowsPerPage || undefined,
      offset,
    });

    const data = objects.map((x) => x.forResponse());

    res.send({
      count: resultsToCount.length,
      data,
    });
  });
};

export async function runPaginatedQuery(db, model, countQuery, selectQuery, params, pagination) {
  const countResult = await db.query(countQuery, {
    replacements: params,
    type: QueryTypes.SELECT,
  });

  const { count } = countResult[0];
  if (count === 0) {
    return {
      data: [],
      count: 0,
    };
  }

  const { page = 0, rowsPerPage = 10 } = pagination;

  const result = await db.query(`${selectQuery} LIMIT :limit OFFSET :offset`, {
    replacements: {
      ...params,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    },
    model,
    type: QueryTypes.SELECT,
    mapToModel: true,
  });

  const forResponse = result.map((x) => renameObjectKeys(x.forResponse()));
  return {
    count,
    data: forResponse,
  };
}
