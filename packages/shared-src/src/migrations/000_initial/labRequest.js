const LAB_REQUEST_STATUSES = {
  RECEPTION_PENDING: 'reception_pending',
  RESULTS_PENDING: 'results_pending',
  TO_BE_VERIFIED: 'to_be_verified',
  VERIFIED: 'verified',
  PUBLISHED: 'published',
};
const LAB_REQUEST_STATUS_VALUES = Object.values(LAB_REQUEST_STATUSES);

module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    sampleTime: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    requestedDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },

    urgent: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    specimenAttached: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },

    status: {
      type: Sequelize.ENUM(LAB_REQUEST_STATUS_VALUES),
      defaultValue: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
    },

    senaiteId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    sampleId: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    requestedById: foreignKey('User'),
    encounterId: foreignKey('Encounter'),
    labTestCategoryId: foreignKey('ReferenceData'),
  },
});
