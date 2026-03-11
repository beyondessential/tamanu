import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { ValidationError } from '@tamanu/errors';
import {
  HIDDEN_PERMISSION_NOUNS,
  NOUNS_WITH_OBJECT_ID,
  PERMISSION_SCHEMA,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';

async function getObjectIdsAndNamesByNoun(models) {
  const promises = NOUNS_WITH_OBJECT_ID.map(async noun => {
    if (models[noun]) {
      const where = {};

      // only include current visibility status records
      if (models[noun].rawAttributes.visibilityStatus) {
        where.visibilityStatus = VISIBILITY_STATUSES.CURRENT;
      }
      const records = await models[noun].findAll({
        attributes: ['id', 'name'],
        where,
        raw: true,
      });
      return [noun, records.map(r => ({ id: r.id, name: r.name }))];
    }
    return null;
  });

  const results = await Promise.all(promises);
  return Object.fromEntries(results.filter(Boolean));
}

export const permissionsRouter = express.Router();

permissionsRouter.get(
  '/roles',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Role');
    const { Role } = req.store.models;
    const roles = await Role.findAll({
      where: { deletedAt: null },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
    res.send({ roles: roles.map(r => ({ id: r.id, name: r.name })) });
  }),
);

/**
 * Returns the permissions matrix for the given roles.
 * Example response:
 * {
 *   "permissions": [
 *     { "verb": "read", "noun": "Survey", "objectId": null, "role-TestPractitioner": "y", "role-TestAdmin": "y" },
 *     { "verb": "read", "noun": "Survey", "objectId": "123", "role-TestPractitioner": "y", "role-TestAdmin": "y" },
 *   ],
 *   "roleIds": ["role-TestPractitioner", "role-TestAdmin"],
 *   "objectNames": { "Survey#123": "Survey 123" }
 * }
 */
permissionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Permission');

    const rolesQuery = req.query.roles;
    if (typeof rolesQuery !== 'string') {
      throw new ValidationError('Query parameter "roles" is required');
    }

    const roleIds = rolesQuery
      .split(',')
      .map(roleId => roleId.trim())
      .filter(Boolean);
    if (!roleIds.length) {
      throw new ValidationError('At least one role ID is required');
    }

    const { Permission } = req.store.models;
    const rows = await Permission.sequelize.query(
      `
      SELECT
        verb,
        noun,
        object_id AS "objectId",
        role_id AS "roleId"
      FROM permissions
      WHERE role_id IN (:roleIds)
      AND deleted_at IS NULL
      ORDER BY noun, verb, object_id
      `,
      {
        replacements: { roleIds },
        type: QueryTypes.SELECT,
      },
    );

    // Build full matrix from the permission schema (valid noun/verb combinations)
    const permissionMap = {};
    for (const [noun, verbs] of Object.entries(PERMISSION_SCHEMA)) {
      if (HIDDEN_PERMISSION_NOUNS.has(noun)) continue;
      for (const verb of verbs) {
        const key = `${verb}#${noun}#`;
        permissionMap[key] = { verb, noun, objectId: null };
      }
    }

    // Pre-populate rows for all objectIds of nouns that support them
    const objectIdEntries = await getObjectIdsAndNamesByNoun(req.store.models);
    const objectNameLookup = {};
    for (const [noun, entries] of Object.entries(objectIdEntries)) {
      const verbs = PERMISSION_SCHEMA[noun] || [];
      for (const { id: objectId, name } of entries) {
        objectNameLookup[`${noun}#${objectId}`] = name;
        for (const verb of verbs) {
          const key = `${verb}#${noun}#${objectId}`;
          if (!permissionMap[key]) {
            permissionMap[key] = { verb, noun, objectId };
          }
        }
      }
    }

    // Layer actual permission data on top (including objectId-specific entries)
    for (const { verb, noun, objectId, roleId } of rows) {
      if (HIDDEN_PERMISSION_NOUNS.has(noun)) continue;
      const key = `${verb}#${noun}#${objectId ?? ''}`;
      if (!permissionMap[key]) {
        permissionMap[key] = { verb, noun, objectId: objectId ?? null };
      }
      permissionMap[key][roleId] = 'y';
    }

    const permissions = Object.values(permissionMap);

    res.send({ permissions, roleIds, objectNames: objectNameLookup });
  }),
);

permissionsRouter.post(
  '/create-batch',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Permission');
    const { permissions } = req.body;
    if (!Array.isArray(permissions) || !permissions.length) {
      throw new ValidationError('permissions array is required and must not be empty');
    }

    const { Permission } = req.store.models;
    const results = await Permission.sequelize.transaction(async () => {
      let created = 0;

      for (const { verb, noun, objectId, roleId } of permissions) {
        Permission.validatePermissionSchema(verb, noun, roleId, objectId);

        const where = { verb, noun, roleId, objectId: objectId ?? null };
        const existing = await Permission.findOne({ where, paranoid: false });
        if (existing && existing.deletedAt) {
          await existing.restore();
          created++;
        } else if (!existing) {
          await Permission.create(where);
          created++;
        }
      }

      return { created };
    });

    res.send(results);
  }),
);

// Delete multiple permissions in a single request
// so we can roll back all changes if one fails.
// So have to use post instead of delete to send data in the body.
permissionsRouter.post(
  '/delete-batch',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'Permission');
    const { permissions } = req.body;
    if (!Array.isArray(permissions) || !permissions.length) {
      throw new ValidationError('permissions array is required and must not be empty');
    }

    const { Permission } = req.store.models;
    const results = await Permission.sequelize.transaction(async () => {
      let deleted = 0;

      for (const { verb, noun, objectId, roleId } of permissions) {
        Permission.validatePermissionSchema(verb, noun, roleId, objectId);

        const count = await Permission.destroy({
          where: { verb, noun, roleId, objectId: objectId ?? null },
        });
        deleted += count;
      }

      return { deleted };
    });

    res.send(results);
  }),
);
