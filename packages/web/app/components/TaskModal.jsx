import React from 'react';
import { FormModal } from './FormModal';
import { TranslatedText } from './Translation/TranslatedText';
import { TaskForm } from '../forms/TaskForm';

export const TaskModal = ({ open, onClose, onCreateTaskSuccess }) => {
  return (
    <FormModal
      width="md"
      title={<TranslatedText stringId="addTask.modal.title" fallback="Add task" />}
      open={open}
      onClose={onClose}
    >
      <TaskForm onClose={onClose} onCreateTaskSuccess={onCreateTaskSuccess} />
    </FormModal>
  );
};
