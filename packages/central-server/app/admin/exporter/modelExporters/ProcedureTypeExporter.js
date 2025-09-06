import { DefaultDataExporter } from './DefaultDataExporter';
import { REFERENCE_TYPES } from '@tamanu/constants';

export class ProcedureTypeExporter extends DefaultDataExporter {
  async getData() {
    const procedureTypes = await this.models.ReferenceData.findAll({
      where: {
        type: REFERENCE_TYPES.PROCEDURE_TYPE,
      },
      include: {
        model: this.models.Survey,
        as: 'surveys',
      },
    });

    return procedureTypes.map(({ dataValues: { surveys, ...rest } }) => ({
      ...rest,
      formLink: surveys.map(({ id }) => id).join(','),
    }));
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
