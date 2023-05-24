import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { HIDDEN_VISIBILITY_STATUSES } from 'shared/constants/importable';
import { permissionCheckingRouter } from 'shared/utils/crudHelpers';

export const patientFieldDefinition = permissionCheckingRouter('read', 'Patient');

patientFieldDefinition.get(
  '/$',
  asyncHandler(async (req, res) => {
    const values = await req.db.query(
      `
        SELECT
          d.id AS "definitionId",
          d.name,
          d.field_type AS "fieldType",
          d.options,
          c.name AS category
        FROM patient_field_definitions d
        LEFT JOIN patient_field_definition_categories c
          ON d.category_id = c.id
        WHERE d.visibility_status NOT IN (:hiddenStatuses)
        ORDER BY category ASC, name ASC;
      `,
      {
        replacements: {
          hiddenStatuses: HIDDEN_VISIBILITY_STATUSES,
        },
        type: QueryTypes.SELECT,
      },
    );
    res.send({
      count: values.length,
      data: values,
    });
  }),
);
