import { DefaultDataExporter } from './DefaultDataExporter';

export class PatientFieldDefinitionExporter extends DefaultDataExporter {
  customCellFormatter = {
    options: value => {
      if (!value || typeof value !== 'object') {
        return value;
      }

      return value.join(',');
    },
  };
}
