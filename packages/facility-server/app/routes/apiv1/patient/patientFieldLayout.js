import asyncHandler from 'express-async-handler';

import { permissionCheckingRouter } from '@tamanu/shared/utils/crudHelpers';

export const patientFieldLayout = permissionCheckingRouter('read', 'Patient');

patientFieldLayout.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { PatientFieldLayout, PatientFieldDefinition, PatientFieldDefinitionCategory } =
      req.models;

    const layouts = await PatientFieldLayout.findAll({
      include: [
        {
          model: PatientFieldDefinition,
          as: 'definition',
          attributes: ['id', 'name', 'fieldType', 'options'],
        },
        {
          model: PatientFieldDefinitionCategory,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
      order: [
        ['section', 'ASC NULLS LAST'],
        ['categoryId', 'ASC NULLS LAST'],
        ['sortOrder', 'ASC'],
      ],
    });

    res.send({
      count: layouts.length,
      data: layouts.map(l => l.forResponse()),
    });
  }),
);
