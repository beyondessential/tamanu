import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { PATIENT_FIELD_DEFINITION_HIDDEN_STATE_VALUES } from 'shared/constants/patientFields';
import { permissionCheckingRouter } from '../crudHelpers';

export const patientFieldDefinition = permissionCheckingRouter('create', 'Patient');

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
        WHERE d.state NOT IN (:disallowedStates)
        ORDER BY category ASC, name ASC;
      `,
      {
        replacements: {
          disallowedStates: PATIENT_FIELD_DEFINITION_HIDDEN_STATE_VALUES,
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
