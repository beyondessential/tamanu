import React from 'react';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const REFERENCE_DATA_TYPE_TO_LABEL = {
  taskTemplate: <TranslatedText stringId="encounter.task.tasks.label" fallback="Tasks" />,
  taskSet: <TranslatedText stringId="encounter.task.taskSets.label" fallback="Task sets" />,
};
