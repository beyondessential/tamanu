const LAB_TEST_STATUSES = {
  RECEPTION_PENDING: 'reception_pending',
  RESULTS_PENDING: 'results_pending',
  TO_BE_VERIFIED: 'to_be_verified',
  VERIFIED: 'verified',
  PUBLISHED: 'published',
};
const LAB_TEST_STATUS_VALUES = Object.values(LAB_TEST_STATUSES);

module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    date: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    status: {
      type: Sequelize.ENUM(LAB_TEST_STATUS_VALUES),
      allowNull: false,
      defaultValue: LAB_TEST_STATUSES.RECEPTION_PENDING,
    },
    result: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    },

    labRequestId: foreignKey('LabRequest'),
    labTestTypeId: foreignKey('LabTestType'),
    categoryId: foreignKey('ReferenceData'),
  },
});
