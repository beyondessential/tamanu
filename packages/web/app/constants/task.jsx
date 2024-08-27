import React from "react";
import { TranslatedText } from "../components/Translation/TranslatedText";

export const REFERENCE_DATA_TYPE_TO_LABEL = {
  taskTemplate: <TranslatedText stringId="encounter.task.task.label" fallback="Task" />,
  taskSet: <TranslatedText stringId="encounter.task.taskSet.label" fallback="Task set" />,
};
