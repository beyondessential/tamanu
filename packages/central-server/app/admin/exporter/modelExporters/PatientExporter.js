import { parseDate } from '@tamanu/shared/utils/dateTime';
import { DefaultDataExporter } from './DefaultDataExporter';

export class PatientExporter extends DefaultDataExporter {
  customCellFormatter = {
    dateOfBirth: value => {
      return parseDate(value);
    },
  };
}
