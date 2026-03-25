import asyncHandler from 'express-async-handler';
import { escapeRegExp } from 'lodash';
import { Op } from 'sequelize';

import { REFERENCE_TYPES } from '@tamanu/constants';
import { NotFoundError } from '@tamanu/errors';
import { getResourceList } from '@tamanu/shared/utils/crudHelpers';

export const getDesignations = asyncHandler(async (req, res) => {
  req.checkPermission('list', 'ReferenceData');

  const idQuery = req.query.id?.trim();
  const nameQuery = req.query.name?.trim();

  const additionalFilters = {
    type: REFERENCE_TYPES.DESIGNATION,
    ...(idQuery && { id: idQuery }),
    ...(nameQuery && {
      name: { [Op.iRegexp]: `\\m${escapeRegExp(nameQuery)}` },
    }),
  };

  const response = await getResourceList(req, 'ReferenceData', '', { additionalFilters });
  res.send(response);
});

export const getDesignationById = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'ReferenceData');

  const {
    store: {
      models: { ReferenceData },
    },
    params: { id },
  } = req;

  const designation = await ReferenceData.findOne({
    where: { id, type: REFERENCE_TYPES.DESIGNATION },
  });
  if (!designation) {
    throw new NotFoundError(`No designation found with ID ‘${id}’`);
  }

  res.send(designation.forResponse());
});
