import React, { useMemo } from 'react';
import styled from 'styled-components';
import { TASK_ACTIONS } from '@tamanu/constants';

import { FormModal } from '../FormModal';
import { TranslatedText } from '../Translation';
import { BodyText } from '../Typography';
import { MarkTaskCompletedForm } from '../../forms/MarkTaskCompletedForm';
import { DeleteTaskForm } from '../../forms/DeleteTaskForm.jsx';
import { MarkTaskNotCompletedForm } from '../../forms/MarkTaskNotCompletedForm';
import { MarkTaskTodoForm } from '../../forms/MarkTaskTodoForm';

const ModalDescription = styled(BodyText)`
  margin-bottom: 34px;
  margin-top: 20px;
`;

const getModalTitle = (action, isRepeatingTask) => {
  switch (action) {
    case TASK_ACTIONS.COMPLETED:
      return (
        <TranslatedText stringId="task.modal.markAsCompleted.title" fallback="Mark as completed" />
      );
    case TASK_ACTIONS.NON_COMPLETED:
      return (
        <TranslatedText
          stringId="task.modal.markAsNotCompleted.title"
          fallback="Mark as not completed"
        />
      );
    case TASK_ACTIONS.DELETED:
      if (isRepeatingTask) {
        return <TranslatedText stringId="task.deleteTasks.modal.title" fallback="Delete tasks" />;
      }
      return <TranslatedText stringId="task.deleteTask.modal.title" fallback="Delete task" />;
    case TASK_ACTIONS.TODO:
      return <TranslatedText stringId="task.modal.toDo.title" fallback="Mark as to-do" />;
    default:
      return '';
  }
};

const getModalDescription = (action, isRepeatingTask, taskIds) => {
  switch (action) {
    case TASK_ACTIONS.COMPLETED:
      return (
        <TranslatedText
          stringId="task.modal.completed.description"
          fallback="Complete details below to mark the task/s as completed."
        />
      );
    case TASK_ACTIONS.NON_COMPLETED:
      return (
        <TranslatedText
          stringId="task.modal.notCompleted.description"
          fallback="Complete details below to mark the task/s as not completed."
        />
      );
    case TASK_ACTIONS.DELETED:
      if (taskIds.length > 1) {
        return (
          <TranslatedText
            stringId="task.modal.deleteMultiple.description"
            fallback="Complete details below to delete tasks. Please note that if the selected tasks include a repeating task, all future instances of the task will also be deleted. This action is irreversible. "
          />
        );
      }
      if (isRepeatingTask) {
        return (
          <TranslatedText
            stringId="task.modal.deleteRepeating.description"
            fallback="Complete details below to delete task. Please note that this is a repeating task and all future instances of the task will also be deleted. This action is irreversible."
          />
        );
      }
      return (
        <TranslatedText
          stringId="task.modal.delete.description"
          fallback="Complete details below to delete task. This action is irreversible."
        />
      );
    case TASK_ACTIONS.TODO:
      return (
        <TranslatedText
          stringId="task.modal.toDo.description"
          fallback="Complete details below to mark task/s as to-do."
        />
      );
    default:
      return '';
  }
};

export const TaskActionModal = ({
  open,
  onClose,
  action,
  refreshTaskTable,
  taskIds,
  isRepeatingTask = false,
}) => {
  const taskActionForm = useMemo(() => {
    switch (action) {
      case TASK_ACTIONS.COMPLETED:
        return (
          <MarkTaskCompletedForm
            onClose={onClose}
            refreshTaskTable={refreshTaskTable}
            taskIds={taskIds}
          />
        );
      case TASK_ACTIONS.NON_COMPLETED:
        return (
          <MarkTaskNotCompletedForm
            onClose={onClose}
            refreshTaskTable={refreshTaskTable}
            taskIds={taskIds}
          />
        );
      case TASK_ACTIONS.DELETED:
        return (
          <DeleteTaskForm onClose={onClose} refreshTaskTable={refreshTaskTable} taskIds={taskIds} />
        );
      case TASK_ACTIONS.TODO:
        return (
          <MarkTaskTodoForm
            onClose={onClose}
            refreshTaskTable={refreshTaskTable}
            taskIds={taskIds}
          />
        );
      default:
        return null;
    }
  }, [action]);

  return (
    <FormModal
      width="md"
      title={getModalTitle(action, isRepeatingTask)}
      open={open}
      onClose={onClose}
    >
      <ModalDescription>{getModalDescription(action, isRepeatingTask, taskIds)}</ModalDescription>
      {taskActionForm}
    </FormModal>
  );
};
