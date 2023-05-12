import { Sequelize } from 'sequelize';

export const LabTestPanelsConfig = models => {
  return {
    attributes: [
      'LabTestPanel.id',
      'LabTestPanel.name',
      'LabTestPanel.code',
      'externalCode',
      [Sequelize.fn('string_agg', Sequelize.col('labTestTypes.id'), ','), 'lab_test_type_ids'],
    ],
    include: [
      {
        model: models.LabTestType,
        attributes: [],
        as: 'labTestTypes',
        required: false,
      },
    ],
    group: ['LabTestPanel.id', 'LabTestPanel.name', 'LabTestPanel.code', 'externalCode'],
  };
};
