import { DefaultDataExporter } from './DefaultDataExporter';

export class LabTestPanelExporter extends DefaultDataExporter {
  async getData() {
    const labTestPanels = await this.models.LabTestPanel.findAll({
      include: [
        {
          model: this.models.LabTestType,
          as: 'labTestTypes',
          attributes: ['id'],
        },
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
