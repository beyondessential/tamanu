import { DefaultDataExporter } from './DefaultDataExporter';

export class PatientFieldDefinitionExporter extends DefaultDataExporter {
  customCellFormatter = {
    options: values => {
      return values?.join(',');
    },
  };
}
