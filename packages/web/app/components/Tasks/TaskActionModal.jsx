import React, { useMemo } from 'react';
import styled from 'styled-components';
import { TASK_STATUSES } from '@tamanu/constants';

import { FormModal } from '../FormModal';
import { TranslatedText } from '../Translation';
import { BodyText } from '../Typography';
import { MarkTaskCompletedForm } from '../../forms/MarkTaskCompletedForm';
import { MarkTaskTodoForm } from '../../forms/MarkTaskTodoForm';

const ModalDescription = styled(BodyText)`
  margin-bottom: 34px;
  margin-top: 20px;
`;

const getModalTitle = action => {
  switch (action) {
    case TASK_STATUSES.COMPLETED:
      return (
        <TranslatedText stringId="task.modal.markAsCompleted.title" fallback="Mark as completed" />
      );
    case TASK_STATUSES.TODO:
      return <TranslatedText stringId="task.modal.toDo.title" fallback="Mark as to-do" />;
    default:
      return '';
  }
};

const getModalDescription = action => {
  switch (action) {
    case TASK_STATUSES.COMPLETED:
      return (
        <TranslatedText
          stringId="task.modal.completed.description"
          fallback="Complete details below to mark the task/s as completed."
        />
      );
    case TASK_STATUSES.TODO:
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

export const TaskActionModal = ({ open, onClose, action, refreshTaskTable, taskIds }) => {
  const taskActionForm = useMemo(() => {
    switch (action) {
      case TASK_STATUSES.COMPLETED:
        return (
          <MarkTaskCompletedForm
            onClose={onClose}
            refreshTaskTable={refreshTaskTable}
            taskIds={taskIds}
          />
        );
      case TASK_STATUSES.TODO:
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
    <FormModal width="md" title={getModalTitle(action)} open={open} onClose={onClose}>
      <ModalDescription>{getModalDescription(action)}</ModalDescription>
      {taskActionForm}
    </FormModal>
  );
};
