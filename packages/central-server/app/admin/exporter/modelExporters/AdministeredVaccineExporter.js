import { parseDate } from '@tamanu/shared/utils/dateTime';
import { DefaultDataExporter } from './DefaultDataExporter';

export class AdministeredVaccineExporter extends DefaultDataExporter {
  customCellFormatter = {
    date: value => {
      return parseDate(value);
    },
    consent: value => {
      return value ? 'y' : 'n';
    },
  };

  async getData() {
    const administeredVaccines = await this.models.AdministeredVaccine.findAll({
      include: [
        {
          model: this.models.Encounter,
          as: 'encounter',
          attributes: ['locationId', 'departmentId', 'examinerId', 'patientId'],
        },
      ],
    });
    const data = administeredVaccines.map(({ dataValues: vaccine }) => {
      const { encounter, ...otherProps } = vaccine;
      return {
        ...otherProps,
        ...encounter.dataValues,
      };
    });

    return data;
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
