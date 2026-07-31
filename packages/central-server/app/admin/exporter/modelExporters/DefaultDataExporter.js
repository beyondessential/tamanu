import { ModelExporter } from './ModelExporter';

export class DefaultDataExporter extends ModelExporter {
  async getData() {
    const modelName = this.dataType.charAt(0).toUpperCase() + this.dataType.slice(1);
    const data = await this.models[modelName].findAll();

    return data;
  }
}
