import { parseDate } from 'shared/utils/dateTime';
import { DefaultDataExporter } from './defaultDataExporter';

export class AdministeredVaccineExporter extends DefaultDataExporter {
  customCellFormatter = {
    date: value => {
      return parseDate(value);
    },
    consent: value => {
      return value ? 'y' : 'n';
    },
  };
}
