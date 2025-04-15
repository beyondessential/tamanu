import React from 'react';
import { FormModal } from '../FormModal';
import { TranslatedText } from '../Translation/TranslatedText';
import { TaskForm } from '../../forms/TaskForm';

export const TaskModal = ({ open, onClose, refreshTaskTable }) => {
  return (
    <FormModal
      width="md"
      title={
        <TranslatedText
          stringId="addTask.modal.title"
          fallback="Add task"
          data-testid="translatedtext-bykz"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-y8n5"
    >
      <TaskForm onClose={onClose} refreshTaskTable={refreshTaskTable} data-testid="taskform-nr80" />
    </FormModal>
  );
};
