const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    await query.sequelize.transaction(async transaction => {
      await query.addColumn(
        'patients',
        'sex_id',
        {
          type: Sequelize.STRING,
          references: {
            model: 'reference_data',
            key: 'id',
          },
        },
        { transaction },
      );

      // only migrate databases with existing patients - new DBs should just import
      // reference data
      const [results] = await query.sequelize.query('SELECT COUNT(*) FROM patients', {
        transaction,
      });
      const { count: patientCount } = results[0];
      if (patientCount > 0) {
        await query.bulkInsert(
          'reference_data',
          [
            {
              id: 'ref/sex/male',
              code: 'male',
              type: 'sex',
              name: 'Male',
              updated_at: new Date(),
              created_at: new Date(),
            },
            {
              id: 'ref/sex/female',
              code: 'female',
              type: 'sex',
              name: 'Female',
              updated_at: new Date(),
              created_at: new Date(),
            },
            {
              id: 'ref/sex/other',
              code: 'other',
              type: 'sex',
              name: 'Other',
              updated_at: new Date(),
              created_at: new Date(),
            },
          ],
          { ignoreDuplicates: true },
        );
        await query.sequelize.query(
          `
        UPDATE patients
        SET sex_id = ('ref/sex/' || sex)
          `,
          { transaction },
        );
      }
      await query.removeColumn('patients', 'sex', { transaction });

      // enums can't clash
      await query.sequelize.query('DROP TYPE enum_patients_sex', { transaction });
    });
  },
  down: async query => {
    await query.sequelize.transaction(async transaction => {
      // WARNING: this migration is technically irreversible without losing information,
      // so it will squash existing data into male/female/other

      // we need to add the column with a default value and then remove it, since it's
      // non-nullable
      await query.addColumn(
        'patients',
        'sex',
        {
          type: Sequelize.ENUM('male', 'female', 'other'),
          allowNull: false,
          defaultValue: 'other',
        },
        { transaction },
      );

      // goes through and sets male and female, remaining values have already been
      // defaulted to 'other'
      await query.sequelize.query(
        `
          UPDATE patients
          SET sex = replace(sex_id, 'ref/sex/', '')::enum_patients_sex
          WHERE sex_id = 'ref/sex/male'
             OR sex_id = 'ref/sex/female'
        `,
        { transaction },
      );

      await query.removeColumn('patients', 'sex_id', { transaction });
    });
  },
};
