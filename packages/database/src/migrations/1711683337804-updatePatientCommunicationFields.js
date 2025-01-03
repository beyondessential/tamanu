import {
  PATIENT_COMMUNICATION_CHANNELS_VALUES,
  PATIENT_COMMUNICATION_TYPES_VALUES,
} from '@tamanu/constants';
import { DataTypes, Sequelize } from 'sequelize';

export async function up(query) {
  await query.changeColumn('patient_communications', 'type', {
    type: DataTypes.TEXT,
    allowNull: false,
  });
  await query.changeColumn('patient_communications', 'channel', {
    type: DataTypes.TEXT,
    allowNull: false,
  });
}

export async function down(query) {
  await query.changeColumn('patient_communications', 'type', {
    type: Sequelize.ENUM(PATIENT_COMMUNICATION_TYPES_VALUES),
    allowNull: false,
  });
  await query.changeColumn('patient_communications', 'channel', {
    type: Sequelize.ENUM(PATIENT_COMMUNICATION_CHANNELS_VALUES),
    allowNull: false,
  });
}
