import {
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_PRODUCT_REFERENCE_DATA_TYPE_CATEGORIES,
} from '@tamanu/constants';
import { ReferenceDataExporter } from './ReferenceDataExporter';

export class InvoiceProductExporter extends ReferenceDataExporter {
  async getData() {
    const invoiceProducts = await this.models.InvoiceProduct.findAll({
      include: [
        {
          model: this.models.ReferenceData,
          as: 'sourceRefDataRecord',
        },
      ],
    });

    // When importing, we map from the familiar categories (Procedure, Drug, etc.) to the underlying models (e.g. ReferenceData, LabTestType, etc.).
    // Here we undo that mapping, ensuring that we handle the fact that multiple categories map to the 'ReferenceData' model.
    return invoiceProducts.map(invoiceProduct => {
      const { sourceRefDataRecord, ...product } = invoiceProduct.dataValues;
      let sourceRecordType;
      if (sourceRefDataRecord) {
        sourceRecordType = INVOICE_PRODUCT_REFERENCE_DATA_TYPE_CATEGORIES[sourceRefDataRecord.type];
      } else {
        sourceRecordType = Object.entries(INVOICE_ITEMS_CATEGORIES_MODELS).find(
          ([value]) => value === product.sourceRecordType,
        )?.[0];
      }
      return {
        ...product,
        sourceRecordType,
      };
    });
  }
}
