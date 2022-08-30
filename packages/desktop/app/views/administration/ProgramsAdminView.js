import React from 'react';
import { ImporterView } from './components/ImporterView';

export const ProgramsAdminView = () => (
  <ImporterView title="Import programs/surveys" endpoint="admin/importProgram" />
);
