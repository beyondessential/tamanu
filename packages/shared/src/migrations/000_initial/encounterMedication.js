module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    date: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    endDate: Sequelize.DATE,

    prescription: Sequelize.STRING,
    note: Sequelize.STRING,
    indication: Sequelize.STRING,
    route: Sequelize.STRING,

    qtyMorning: Sequelize.INTEGER,
    qtyLunch: Sequelize.INTEGER,
    qtyEvening: Sequelize.INTEGER,
    qtyNight: Sequelize.INTEGER,
    encounterId: foreignKey('Encounter'),
    medicationId: foreignKey('ReferenceData'),
    prescriberId: foreignKey('User'),
  },
});
