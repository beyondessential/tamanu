import { REFERENCE_TYPES } from '@tamanu/constants';
import { DefaultDataExporter } from './DefaultDataExporter';
import { Op } from 'sequelize';

export class TaskSetExporter extends DefaultDataExporter {
  async getData() {
    const taskSet = await this.models.ReferenceData.findAll({
      attributes: ['id', 'code', 'name', 'visibilityStatus'],
      where: {
        type: REFERENCE_TYPES.TASK_SET,
      },
    });

    const tasks = await this.models.ReferenceDataRelation.findAll({
      attributes: ['referenceDataId', 'referenceDataParentId'],
      where: {
        referenceDataParentId: { [Op.in]: taskSet.map(({ id }) => id) },
      },
    });

    return taskSet.map(({ id, code, name, visibilityStatus }) => ({
      id,
      code,
      name,
      tasks: tasks
        .filter(({ referenceDataParentId }) => referenceDataParentId === id)
        .map(({ referenceDataId }) => referenceDataId)
        .join(','),
      visibilityStatus,
    }));
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
