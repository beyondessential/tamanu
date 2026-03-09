import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { ValidationError } from '@tamanu/errors';
import { NOUNS_WITH_OBJECT_ID, PERMISSION_SCHEMA } from '@tamanu/constants';

async function getObjectIdsAndNamesByNoun(models) {
  const entries = {};
  for (const noun of NOUNS_WITH_OBJECT_ID) {
    if (models[noun]) {
      const records = await models[noun].findAll({
        attributes: ['id', 'name'],
        raw: true,
      });
      entries[noun] = records.map(r => ({ id: r.id, name: r.name }));
    }
  }
  return entries;
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
    req.checkPermission('list', 'Role');

    const rolesQuery = req.query.roles ?? req.query.roleIds ?? req.query.role;
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
      const key = `${verb}#${noun}#${objectId || ''}`;
      if (!permissionMap[key]) {
        permissionMap[key] = { verb, noun, objectId: objectId || null };
      }
      permissionMap[key][roleId] = 'y';
    }

    const permissions = Object.values(permissionMap);

    res.send({ permissions, roleIds, objectNames: objectNameLookup });
  }),
);

permissionsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Role');
    const { verb, noun, objectId, roleId } = req.body;
    if (!verb || !noun || !roleId) {
      throw new ValidationError('verb, noun, and roleId are required');
    }
    const { Permission } = req.store.models;
    const where = { verb, noun, roleId, objectId: objectId || null };
    const existing = await Permission.findOne({ where, paranoid: false });
    let permission;
    if (existing && existing.deletedAt) {
      await existing.restore();
      permission = existing;
    } else if (!existing) {
      permission = await Permission.create(where);
    } else {
      throw new ValidationError('Permission already exists');
    }
    res.send({ permission: { id: permission.id, verb, noun, objectId: objectId || null, roleId } });
  }),
);

permissionsRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Role');
    const { verb, noun, objectId, roleId } = req.query;
    if (!verb || !noun || !roleId) {
      throw new ValidationError('verb, noun, and roleId are required');
    }
    const { Permission } = req.store.models;
    const deleted = await Permission.destroy({
      where: { verb, noun, roleId, objectId: objectId || null },
    });
    res.send({ deleted });
  }),
);
