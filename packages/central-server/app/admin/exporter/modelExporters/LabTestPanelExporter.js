import { DefaultDataExporter } from './DefaultDataExporter';

export class LabTestPanelExporter extends DefaultDataExporter {
  async getData() {
    const labTestPanels = await this.models.LabTestPanel.findAll({
      include: [
        {
          model: this.models.LabTestType,
          as: 'labTestTypes',
          attributes: ['id'],
          through: {
            attributes: ['order'],
          },
        },
      ],
      order: [
        [
          'labTestTypes',
          this.models.LabTestPanelLabTestTypes,
          'order',
          'ASC',
        ],
      ],
    });

    return labTestPanels.map(({ dataValues: { labTestTypes, ...rest } }) => ({
      ...rest,
      testTypesInPanel: labTestTypes.map(({ id }) => id).join(','),
    }));
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
