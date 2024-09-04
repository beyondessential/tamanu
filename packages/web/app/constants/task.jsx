import React from "react";
import { TranslatedText } from "../components/Translation/TranslatedText";

export const REFERENCE_DATA_TYPE_TO_LABEL = {
  taskTemplate: <TranslatedText stringId="encounter.task.task.label" fallback="Task" />,
  taskSet: <TranslatedText stringId="encounter.task.taskSet.label" fallback="Task set" />,
};

export const TASK_FREQUENCY_UNIT_OPTIONS = {
  MINUTE: 'minute (s)',
  HOUR: 'hour (s)',
  DAY: 'day (s)',
};

export const TASK_FREQUENCY_UNIT_TO_VALUE = {
  [TASK_FREQUENCY_UNIT_OPTIONS.MINUTE]: 'minute',
  [TASK_FREQUENCY_UNIT_OPTIONS.HOUR]: 'hour',
  [TASK_FREQUENCY_UNIT_OPTIONS.DAY]: 'day',
};