import React from 'react';
import { useParams } from 'react-router-dom';

export const ProgramRegistryView = () => {
  const params = useParams();
  return <div>param: {params.programRegistryCode}</div>;
};
