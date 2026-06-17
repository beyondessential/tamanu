import asyncHandler from 'express-async-handler';
import { escapeRegExp } from 'lodash-es';
import { Op } from 'sequelize';

import { NotFoundError } from '@tamanu/errors';
import { getResourceList } from '@tamanu/shared/utils/crudHelpers';
import { getDeletableRoleOrThrow } from './roles.delete';

export const getRoles = asyncHandler(async (req, res) => {
  req.checkPermission('list', 'Role');

  const filters = [];
  const idQuery = req.query.id?.trim();
  if (idQuery) {
    filters.push({
      // Not matching word boundary; IDs often camel case
      id: { [Op.iLike]: `%${idQuery}%` },
    });
  }
  const nameQuery = req.query.name?.trim();
  if (nameQuery) {
    filters.push({
      name: { [Op.iRegexp]: `\\m${escapeRegExp(nameQuery)}` },
    });
  }

  const options = {};
  if (filters.length > 0) {
    options.additionalFilters = filters.length === 1 ? filters[0] : { [Op.and]: filters };
  }

  const response = await getResourceList(req, 'Role', '', options);
  res.send(response);
});

export const getRoleById = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'Role');

  const {
    store: {
      models: { Role },
    },
    params: { id },
  } = req;

  const role = await Role.findByPk(id);
  if (!role) {
    throw new NotFoundError(`No role found with ID ‘${id}’`);
  }

  res.send(role);
});

export const getRoleDeletabilityById = asyncHandler(async (req, res) => {
  req.checkPermission('delete', 'Role');

  const {
    store: { models, sequelize },
    params: { id },
  } = req;

  await sequelize.transaction({ readOnly: true }, async () => {
    await getDeletableRoleOrThrow(models, id);
  });

  res.status(204).send();
});
