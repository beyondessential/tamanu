import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../api';
import { SelectInput } from './Field';

export const LanguageSelector = () => {
  const api = useApi();

  const { data: languageOptions = [], error } = useQuery(['languageList'], () =>
    api.get('translation/preLogin'),
  );

  return (
    <SelectInput options={languageOptions} label="Language" isClearable={false} error={!!error} />
  );
};
