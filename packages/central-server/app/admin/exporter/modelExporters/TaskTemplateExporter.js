import { REFERENCE_TYPES } from '@tamanu/constants';
import { ReferenceDataExporter } from './ReferenceDataExporter';
import ms from 'ms';

export class TaskTemplateExporter extends ReferenceDataExporter {
  async getData() {
    const tasks = await this.models.ReferenceData.findAll({
      where: {
        type: REFERENCE_TYPES.TASK_TEMPLATE,
      },
      include: {
        model: this.models.TaskTemplate,
        as: 'taskTemplate',
        include: {
          model: this.models.TaskTemplateDesignation,
          as: 'designations',
          include: {
            model: this.models.ReferenceData,
            as: 'designation',
            attributes: ['id'],
          },
        },
      },
    });

    return tasks.map(task => ({
      ...task.dataValues,
      highPriority: task.taskTemplate?.highPriority,
      assignedTo: task.taskTemplate?.designations.map(it => it.designation.id).join(', '),
      taskFrequency:
        task.taskTemplate?.frequencyValue && task.taskTemplate?.frequencyUnit
          ? ms(ms(`${task.taskTemplate.frequencyValue} ${task.taskTemplate.frequencyUnit}`), {
              long: true,
            })
          : '',
    }));
  }

  customHiddenColumns() {
    return ['type', 'taskTemplate'];
  }
}
