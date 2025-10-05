import React from 'react';
import { useLocation } from 'react-router';

export function useUrlSearchParams() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}
