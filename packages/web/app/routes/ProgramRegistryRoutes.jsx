import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { ProgramRegistryView } from '../views/programRegistry/ProgramRegistryView';

export const ProgramRegistryRoutes = () => {
  return (
    <Routes>
      <Route path=":programRegistryId" element={<ProgramRegistryView />} />
      <Route path="*" element={<Navigate to=".." replace />} />
    </Routes>
  );
};
