import { useSelector, useDispatch } from 'react-redux';
import { logout, idleTimeout } from '../store';
import { useApi } from '../api';
import { useQueryClient } from '@tanstack/react-query';

// This is just a redux selector for now.
// This should become its own proper context once the auth stuff
// is refactored out of redux.

export const useAuth = () => {
  const dispatch = useDispatch();
  const api = useApi();
  const queries = useQueryClient();

  return {
    ...useSelector(state => ({
      currentUser: state.auth.user,
      ability: state.auth.ability,
      facility: state.auth.server?.facility || {},
      centralHost: state.auth.server?.centralHost,
    })),
    onLogout: () => {
      dispatch(logout());
      queries.invalidateQueries();
    },
    onTimeout: () => dispatch(idleTimeout()),
    refreshToken: () => api.refreshToken(),
  };
};
