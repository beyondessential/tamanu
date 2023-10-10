import express from 'express';
import { Sequelize, Op } from 'sequelize';

import { VISIBILITY_STATUSES, REGISTRATION_STATUSES } from '@tamanu/constants';
import { simpleGet, simpleGetList } from '@tamanu/shared/utils/crudHelpers';

export const programRegistry = express.Router();

programRegistry.get('/:id', simpleGet('ProgramRegistry'));
programRegistry.get(
  '/$',
  simpleGetList('ProgramRegistry', '', {
    additionalFilters: ({ db, query }) => ({
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      ...(query.excludePatientId
        ? {
            id: {
              [Op.notIn]: Sequelize.literal(
                `(
                    SELECT DISTINCT(pr.id)
                    FROM program_registries pr
                    INNER JOIN patient_program_registrations ppr
                    ON ppr.program_registry_id = pr.id
                    WHERE
                      ppr.patient_id = ${db.escape(query.excludePatientId)}
                    AND
                      ppr.registration_status != '${REGISTRATION_STATUSES.RECORDED_IN_ERROR}'
                  )`,
              ),
            },
          }
        : {}),
    }),
  }),
);
