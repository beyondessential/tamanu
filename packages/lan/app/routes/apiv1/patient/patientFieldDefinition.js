import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { PATIENT_FIELD_DEFINITION_STATES } from 'shared/constants/patientFields';
import { permissionCheckingRouter } from '../crudHelpers';

export const patientFieldDefinition = permissionCheckingRouter('create', 'Patient');

patientFieldDefinition.get(
  '/$',
  asyncHandler(async (req, res) => {
    // equivalent to /:id/fields except doesn't populate values
    // if you change this, also look in ./patientRelations.js
    const values = await req.db.query(
      `
        SELECT
          d.id AS "definitionId",
          d.name AS name,
          c.name AS category
        FROM patient_field_definitions d
        LEFT JOIN patient_field_definition_categories c
          ON d.category_id = c.id
            AND d.state NOT IN (:disallowedStates)
        ORDER BY category ASC, name ASC;
      `,
      {
        replacements: {
          disallowedStates: [PATIENT_FIELD_DEFINITION_STATES.HISTORICAL],
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
