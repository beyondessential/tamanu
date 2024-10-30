import { DefaultDataExporter } from './DefaultDataExporter';

export class UserExporter extends DefaultDataExporter {
  async getData() {
    const users = await this.models.User.findAll({
      include: [
        {
          model: this.models.Facility,
          as: 'facilities',
          attributes: ['id'],
        },
      ],
    });

    return users.map(({ dataValues: { facilities, ...rest } }) => ({
      ...rest,
      allowedFacilities: facilities.map(({ id }) => id).join(','),
    }));
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
