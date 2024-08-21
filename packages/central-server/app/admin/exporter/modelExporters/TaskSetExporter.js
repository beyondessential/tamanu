import { REFERENCE_TYPES } from '@tamanu/constants';
import { DefaultDataExporter } from './DefaultDataExporter';
import { Op } from 'sequelize';

export class TaskSetExporter extends DefaultDataExporter {
  async getData() {
    const taskSets = await this.models.ReferenceData.findAll({
      attributes: ['id', 'code', 'name', 'visibilityStatus'],
      where: {
        type: REFERENCE_TYPES.TASK_SET,
      },
    });

    const tasks = await this.models.ReferenceDataRelation.findAll({
      attributes: ['referenceDataId', 'referenceDataParentId'],
      where: {
        referenceDataParentId: { [Op.in]: taskSets.map(({ id }) => id) },
      },
    });

    return taskSets.map(taskSet => ({
      ...taskSet.dataValues,
      tasks: tasks
        .filter(({ referenceDataParentId }) => referenceDataParentId === taskSet.id)
        .map(({ referenceDataId }) => referenceDataId)
        .join(','),
    }));
  }

  getHeadersFromData(data) {
    return Object.keys(data[0]);
  }
}
