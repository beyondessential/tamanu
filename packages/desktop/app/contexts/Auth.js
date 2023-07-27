import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { logout, idleTimeout } from '../store';
import { useApi } from '../api';
import { useEncounterNotes } from './EncounterNotes';

// This is just a redux selector for now.
// This should become its own proper context once the auth stuff
// is refactored out of redux.

export const useAuth = () => {
  const dispatch = useDispatch();
  const api = useApi();
  const queries = useQueryClient();
  const { resetNoteContext } = useEncounterNotes();

  return {
    ...useSelector(state => ({
      currentUser: state.auth.user,
      ability: state.auth.ability,
      facility: state.auth.server?.facility || {},
      centralHost: state.auth.server?.centralHost,
      currentRole: state.auth.role,
    })),
    onLogout: () => {
      dispatch(logout());
      queries.invalidateQueries();
      resetNoteContext();
    },
    onTimeout: () => dispatch(idleTimeout()),
    refreshToken: () => api.refreshToken(),
  };
};
