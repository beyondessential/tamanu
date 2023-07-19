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
    const data = labTestPanels.map(({ dataValues: panel }) => {
      const { labTestTypes, ...otherProps } = panel;
      const testTypes = labTestTypes
        .map(({ id }) => {
          return id;
        })
        .join(',');
      return {
        ...otherProps,
        testTypesInPanel: testTypes,
      };
    });

    return data;
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
