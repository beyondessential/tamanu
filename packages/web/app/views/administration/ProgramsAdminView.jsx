import React from 'react';
import { ImportExportView } from './components/ImportExportView';

export const ProgramsAdminView = () => (
  <ImportExportView title="Programs (aka forms)" endpoint="program" disableExport /> // TODO: when export is supported in TAN-2029, remove disableExport support everywhere
);
