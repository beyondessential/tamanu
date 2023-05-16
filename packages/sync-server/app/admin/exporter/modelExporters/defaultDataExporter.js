import { ModelExporter } from './ModelExporter';

const CUSTOM_TAB_NAMES = {
  patientFieldDefinitionCategory: 'Patient Field Def Category',
};

export class DefaultDataExporter extends ModelExporter {
  async getData() {
    const modelName = this.dataType.charAt(0).toUpperCase() + this.dataType.slice(1);
    const data = await this.models[modelName].findAll();

    return data;
  }

  customTabName() {
    return CUSTOM_TAB_NAMES[this.dataType];
  }
}
