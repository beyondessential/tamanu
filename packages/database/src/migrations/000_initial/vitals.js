const AVPU_OPTIONS = [
  { value: 'alert', label: 'Alert' },
  { value: 'verbal', label: 'Verbal' },
  { value: 'pain', label: 'Pain' },
  { value: 'unresponsive', label: 'Unresponsive' },
];

module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    dateRecorded: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    temperature: Sequelize.FLOAT,
    weight: Sequelize.FLOAT,
    height: Sequelize.FLOAT,
    sbp: Sequelize.FLOAT,
    dbp: Sequelize.FLOAT,
    heartRate: Sequelize.FLOAT,
    respiratoryRate: Sequelize.FLOAT,
    svo2: Sequelize.FLOAT,
    avpu: Sequelize.ENUM(AVPU_OPTIONS.map(x => x.value)),
    encounterId: foreignKey('Encounter'),
  },
});
