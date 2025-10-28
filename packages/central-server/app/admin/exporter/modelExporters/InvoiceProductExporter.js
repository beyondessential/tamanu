import { ReferenceDataExporter } from './ReferenceDataExporter';

export class InvoiceProductExporter extends ReferenceDataExporter {
  async getData() {
    return await this.models.InvoiceProduct.findAll();
  }

  customHiddenColumns() {
    return ['sourceRecordType'];
  }
}
