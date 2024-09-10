import React from 'react';
import styled from 'styled-components';
import { TASK_STATUSES } from '@tamanu/constants';

import { FormModal } from '../FormModal';
import { TranslatedText } from '../Translation';
import { BodyText } from '../Typography';
import { MarkTaskCompletedForm } from '../../forms/MarkTaskCompletedForm';

const ModalDescription = styled(BodyText)`
  margin-bottom: 34px;
  margin-top: 20px;
`;

export const TaskActionModal = ({ open, onClose, action, refreshTaskTable, taskIds }) => {
  const getTaskActionForm = () => {
    switch (action) {
      case TASK_STATUSES.COMPLETED:
        return (
          <MarkTaskCompletedForm
            onClose={onClose}
            refreshTaskTable={refreshTaskTable}
            taskIds={taskIds}
          />
        );
      default:
        return null;
    }
  };

  return (
    <FormModal
      width="md"
      title={
        <TranslatedText stringId="task.markAsCompleted.modal.title" fallback="Mark as completed" />
      }
      open={open}
      onClose={onClose}
    >
      <ModalDescription>
        <TranslatedText
          stringId="task.action.modal.description"
          fallback="Complete details below to mark the task/s as not completed."
        />
      </ModalDescription>
      {getTaskActionForm()}
    </FormModal>
  );
};
