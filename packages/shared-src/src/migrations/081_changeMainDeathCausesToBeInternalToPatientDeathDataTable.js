import { STRING, INTEGER, QueryTypes } from 'sequelize';

const MAIN_CAUSES = ['primary_cause', 'antecedent_cause1', 'antecedent_cause2'];

export async function up(query) {
  for (const col of MAIN_CAUSES) {
    await query.addColumn('patient_death_data', `${col}_time_after_onset`, {
      type: INTEGER,
      allowNull: true,
      defaultValue: null,
    });
    await query.addColumn('patient_death_data', `${col}_condition_id`, {
      type: STRING,
      allowNull: true,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    });

    await query.sequelize.query(`
      UPDATE patient_death_data
      SET
        ${col}_condition_id = death_causes.condition_id,
        ${col}_time_after_onset = death_causes.time_after_onset
      FROM death_causes
      WHERE patient_death_data.${col}_id = death_causes.id
    `);

    const deathCausesDeleteIds = (
      await query.sequelize.query(
        `
          SELECT ${col}_id
          FROM patient_death_data
          WHERE ${col}_id IS NOT NULL
        `,
        { type: QueryTypes.SELECT },
      )
    ).map(d => d[`${col}_id`]);

    await query.removeColumn('patient_death_data', `${col}_id`);

    if (deathCausesDeleteIds.length > 0) {
      await query.sequelize.query('DELETE FROM death_causes WHERE death_causes.id IN(:ids)', {
        replacements: {
          ids: deathCausesDeleteIds,
        },
      });
    }
  }

  await query.renameTable('death_causes', 'contributing_death_causes');
}

export async function down(query) {
  await query.renameTable('contributing_death_causes', 'death_causes');

  for (const col of MAIN_CAUSES) {
    await query.addColumn('patient_death_data', `${col}_id`, {
      type: STRING,
      allowNull: true,
      references: {
        model: 'death_causes',
        key: 'id',
      },
    });

    // https://stackoverflow.com/a/21327318
    // can't rely on postgres extensions being present ;_;
    const uuidgen = `SELECT uuid_in(overlay(overlay(md5(random()::text || ':' || random()::text) placing '4' from 13) placing to_hex(floor(random()*(11-8+1) + 8)::int)::text from 17)::cstring)`;

    // only postgres supports using this syntax
    await query.sequelize.query(`
      WITH inserted AS (
        INSERT INTO death_causes (id, patient_death_data_id, condition_id, time_after_onset)
        SELECT (${uuidgen}), pdd.id, pdd.${col}_condition_id, pdd.${col}_time_after_onset
        FROM patient_death_data pdd
        WHERE pdd.${col}_condition_id IS NOT NULL
        RETURNING id, patient_death_data_id
      )
      UPDATE patient_death_data pdd
      SET ${col}_id = inserted.id
      FROM inserted
      WHERE pdd.id = inserted.patient_death_data_id
    `);

    await query.removeColumn('patient_death_data', `${col}_condition_id`);
    await query.removeColumn('patient_death_data', `${col}_time_after_onset`);
  }
}
