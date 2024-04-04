import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/Auth';

export const usePermission = (noun, verb) => {
  const { ability } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // When auth is reloading ability.can can be temporarily undefined
    const permission = typeof ability.can === 'function' && ability.can(verb, noun);
    setHasPermission(permission);
  }, [ability, verb, noun]);

  return hasPermission;
};
