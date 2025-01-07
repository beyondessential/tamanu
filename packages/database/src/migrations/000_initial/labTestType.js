const QUESTION_TYPES = {
  NUMBER: 'number',
  STRING: 'string',
};

const QUESTION_TYPE_VALUES = Object.values(QUESTION_TYPES);

module.exports = ({ Sequelize, foreignKey }) => ({
  fields: {
    code: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    },
    unit: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    },
    maleMin: Sequelize.FLOAT,
    maleMax: Sequelize.FLOAT,
    femaleMin: Sequelize.FLOAT,
    femaleMax: Sequelize.FLOAT,
    rangeText: Sequelize.STRING,
    questionType: {
      type: Sequelize.ENUM(QUESTION_TYPE_VALUES),
      allowNull: false,
      defaultValue: QUESTION_TYPES.NUMBER,
    },
    options: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    labTestCategoryId: foreignKey('ReferenceData'),
  },
});
