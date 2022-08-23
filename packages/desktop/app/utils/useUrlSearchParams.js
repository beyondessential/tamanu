import React from 'react';
import { useLocation } from 'react-router-dom';

export function useUrlSearchParams() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}
