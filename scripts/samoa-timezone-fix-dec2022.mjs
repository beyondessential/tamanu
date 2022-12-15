// Run inside sync-server shell by:
// > tzfix = await import('../../scripts/samoa-timezone-fix-dec2022.mjs');
// > await tzfix.run(store);

import { Sequelize, DataTypes, Op } from 'sequelize';

export async function run(store) {
  const {
    models: { AdministeredVaccine, Encounter, LabRequest, LabTest, Patient },
    sequelize,
    sequelize: { queryInterface: query },
  } = store;

  await sequelize.transaction(async () => {
    // TODO
  });
}
