import { DefaultDataExporter } from './DefaultDataExporter';

export class LabPanelExporter extends DefaultDataExporter {
  async getData() {
    const labPanels = await this.models.LabPanel.findAll({
      include: [
        {
          model: this.models.LabTestType,
          as: 'labTestTypes',
          attributes: ['id'],
        },
      ],
    });

    return labPanels.map(({ dataValues: { labTestTypes, ...rest } }) => ({
      ...rest,
      testTypesInPanel: labTestTypes.map(({ id }) => id).join(','),
    }));
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
