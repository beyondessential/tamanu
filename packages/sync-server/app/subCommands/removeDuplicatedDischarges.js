import { Command } from 'commander';

import { log } from 'shared/services/logging';

import { initDatabase } from '../database';
import { sleepAsync } from '../../../shared/src/utils/sleepAsync';

export async function removeDuplicatedDischarges(options = {}) {
  const { batchSize = Number.MAX_SAFE_INTEGER } = options;
  log.info(`Removing duplicated discharges with options:`, options);

  const store = await initDatabase({ testMode: false });
  const { sequelize } = store;

  try {
    let fromId = '';

    while (fromId != null) {
      const [[{ maxId }]] = await sequelize.query(
        `
            WITH 

            -- For batching by encounters
            batch_encounters as (
                SELECT * FROM encounters
                WHERE id > :fromId
                AND deleted_at IS NULL
                ORDER BY id
                LIMIT :limit
            ),

            ordered_discharges AS
            (
                SELECT discharges.id,
                discharges.encounter_id,
                row_number() over (PARTITION BY encounter_id ORDER BY encounter_id, discharges.updated_at DESC) as row_num
                FROM discharges
                JOIN batch_encounters ON batch_encounters.id = discharges.encounter_id
                WHERE discharges.deleted_at IS NULL
            ),
                    
            deleted_discharges AS
            (
                UPDATE discharges
                SET deleted_at = now()
                WHERE id IN (SELECT id FROM ordered_discharges WHERE row_num > 1)
                RETURNING encounter_id
            )

            SELECT MAX(id) as "maxId" FROM batch_encounters;
       `,
        {
          replacements: {
            fromId,
            limit: batchSize,
          },
        },
      );

      fromId = maxId;

      log.info(`Deleted duplicated discharges for ${batchSize} encounters...`);

      sleepAsync(50);
    }

    log.info(`Removed duplicated discharges successfully.`);

    process.exit(0);
  } catch (error) {
    log.info(`Command failed: ${error.stack}\n`);
    process.exit(1);
  }
}

export const removeDuplicatedDischargesCommand = new Command('removeDuplicatedDischarges')
  .description('Remove duplicated discharges')
  .option('-b, --batchSize <number>', 'Batching size for number of encounters')

  .action(removeDuplicatedDischarges);
