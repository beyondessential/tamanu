import { SETTINGS_SCOPES } from '@tamanu/constants';

import { END, type Steps, type StepArgs } from '../step.js';

// Central-scope settings never sync: central drops any lookup rows it holds for them, and a
// facility deletes any copies it holds. Their secrets are readable with the PSK every facility has.
export const STEPS: Steps = [
  {
    at: END,
    async run({ sequelize, serverType }: StepArgs) {
      const replacements = { central: SETTINGS_SCOPES.CENTRAL };
      if (serverType === 'central') {
        await sequelize.query(
          `DELETE FROM sync_lookup
          WHERE record_type = 'settings'
            AND record_id IN (SELECT id::text FROM settings WHERE scope = :central)`,
          { replacements },
        );
        return;
      }
      await sequelize.query(`DELETE FROM settings WHERE scope = :central`, { replacements });
    },
  },
];
