import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useApi } from '../../../api';

const useTranslationQuery = () => {
  const api = useApi();
  return useQuery(['translation'], () => api.get(`admin/translation`));
};

export const TranslationForm = () => {
  const { data, error, isLoading } = useTranslationQuery();
  return (
    <div>
      <h1>Translation Form</h1>
      <p>TODO: Implement</p>
    </div>
  );
};
