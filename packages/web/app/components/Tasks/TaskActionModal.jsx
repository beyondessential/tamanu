import React, { useMemo } from 'react';
import styled from 'styled-components';
import { TASK_STATUSES } from '@tamanu/constants';

import { FormModal } from '../FormModal';
import { TranslatedText } from '../Translation';
import { BodyText } from '../Typography';
import { MarkTaskCompletedForm } from '../../forms/MarkTaskCompletedForm';
import { MarkTaskNotCompletedForm } from '../../forms/MarkTaskNotCompletedForm';

const ModalDescription = styled(BodyText)`
  margin-bottom: 34px;
  margin-top: 20px;
`;

const getModalTitle = action => {
  switch (action) {
    case TASK_STATUSES.COMPLETED:
      return (
        <TranslatedText stringId="task.markAsCompleted.modal.title" fallback="Mark as completed" />
      );
    case TASK_STATUSES.NON_COMPLETED:
      return (
        <TranslatedText
          stringId="task.markAsNotCompleted.modal.title"
          fallback="Mark as not completed"
        />
      );
    default:
      return '';
  }
};

const getModalDescription = action => {
  switch (action) {
    case TASK_STATUSES.COMPLETED:
      return (
        <TranslatedText
          stringId="task.action.modal.description"
          fallback="Complete details below to mark the task/s as completed."
        />
      );
    case TASK_STATUSES.NON_COMPLETED:
      return (
        <TranslatedText
          stringId="task.action.modal.description"
          fallback="Complete details below to mark the task/s as not completed."
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
      case TASK_STATUSES.NON_COMPLETED:
        return (
          <MarkTaskNotCompletedForm
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
