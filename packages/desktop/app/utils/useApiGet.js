import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../api';

/*
  Uses api.get and returns a compound state that specifies
  the fetching status. Useful for components that load their
  own data.

  You should be able to use it just as you use api.get, with an
  extra argument dependencies, which will be used to restart the
  fetching.

  It also returns a special handler reloadComponent to trigger a
  render on the component you're using if needed.
*/
export const useApiGet = (endpoint, query, options, dependencies = []) => {
  const api = useApi();
  const [response, setResponse] = useState(undefined);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hookDeps, setHookDeps] = useState(dependencies);
  const [refreshCount, setRefreshCount] = useState(0);
  const reloadComponent = useCallback(() => {
    setRefreshCount(prevCount => prevCount + 1);
  }, []);

  // Check if dependencies changed (shallow comparison)
  for (let i = 0; i < hookDeps.length; i++) {
    if (hookDeps.length !== dependencies.length || hookDeps[i] !== dependencies[i]) {
      setHookDeps(dependencies);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(endpoint, query, options);
        setResponse(res);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [hookDeps, endpoint, query, options, api, refreshCount]);

  return [response, error, loading, reloadComponent];
};
