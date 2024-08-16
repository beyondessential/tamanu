import { REFERENCE_TYPES } from '@tamanu/constants';
import { ReferenceDataExporter } from './ReferenceDataExporter';

export class TaskExporter extends ReferenceDataExporter {
  async getData() {
    const data = await this.models.ReferenceData.findAll({
      where: {
        type: REFERENCE_TYPES.TASK,
      },
      include: {
        model: this.models.TaskTemplate,
        as: 'taskTemplate',
        include: {
          model: this.models.TaskTemplateDesignation,
          as: 'designations',
          include: {
            model: this.models.ReferenceData,
            as: 'referenceData',
            attributes: ['id'],
          },
        },
      },
    });

    return data;
  }

  getHeaders(data) {
    return super.getHeaders(data).concat(['highPriority', 'assignedTo', 'taskFrequency']);
  }

  formatedCell(header, value, row) {
    switch (header) {
      case 'highPriority':
        return row.taskTemplate?.highPriority;
      case 'assignedTo':
        return row.taskTemplate?.designations.map(it => it.referenceData.id).join(', ');
      case 'taskFrequency':
        return row.taskTemplate?.frequencyValue
          ? `${row.taskTemplate.frequencyValue} ${row.taskTemplate.frequencyUnit}`
          : '';
      default:
        return super.formatedCell(header, value);
    }
  }

  customHiddenColumns() {
    return ['type', 'taskTemplate'];
  }
}
