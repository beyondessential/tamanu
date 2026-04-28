import { DefaultDataExporter } from './DefaultDataExporter';

export class InvoicePriceListExporter extends DefaultDataExporter {
  customCellFormatter = {
    rules: value => JSON.stringify(value),
  };
}
