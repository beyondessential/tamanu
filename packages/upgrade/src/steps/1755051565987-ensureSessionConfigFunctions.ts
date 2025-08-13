import { SESSION_CONFIG_PREFIX } from '@tamanu/constants/database';
import type { Steps, StepArgs } from '../step.ts';
import { START } from '../step.js';

export const STEPS: Steps = [
  {
    at: START,
    async check({ sequelize }: StepArgs): Promise<boolean> {
      // Check if both get_session_config and set_session_config functions exist
      const result = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN ('get_session_config', 'set_session_config');
      `);

      const count = parseInt((result[0] as any)[0].count, 10);
      // Return true if any of the functions are missing
      return count < 2;
    },
    async run({ sequelize, log }: StepArgs): Promise<void> {
      log.info('Creating session_config functions');

      await sequelize.query(`
        CREATE OR REPLACE FUNCTION get_session_config(key TEXT, default_value TEXT)
        RETURNS text AS $$
        DECLARE
          full_key TEXT = '${SESSION_CONFIG_PREFIX}' || key;
        BEGIN
          RETURN coalesce(nullif(current_setting(full_key, true), ''), default_value);
        END;
        $$ LANGUAGE plpgsql;
      `);

      await sequelize.query(`
        CREATE OR REPLACE FUNCTION set_session_config(key TEXT, value TEXT, is_local BOOLEAN DEFAULT FALSE)
        RETURNS void AS $$
        DECLARE
          full_key TEXT = '${SESSION_CONFIG_PREFIX}' || key;
        BEGIN
          PERFORM set_config(full_key, value, is_local);
        END;
        $$ LANGUAGE plpgsql;
      `);

      log.info('Session config functions created successfully');
    },
  },
];
