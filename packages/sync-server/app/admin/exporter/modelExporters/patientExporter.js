import { parseDate } from 'shared/utils/dateTime';
import { DefaultDataExporter } from './defaultDataExporter';

export class PatientExporter extends DefaultDataExporter {
  customCellFormatter = {
    dateOfBirth: value => {
      return parseDate(value);
    },
  };
}
