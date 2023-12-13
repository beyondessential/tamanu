import { useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../api';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { idleTimeout, logout } from '../store';
import { useEncounterNotes } from './EncounterNotes';
// This is just a redux selector for now.
// This should become its own proper context once the auth stuff
// is refactored out of redux.

export const useAuth = () => {
  const dispatch = useDispatch();
  const api = useApi();
  const queries = useQueryClient();
  const { resetNoteContext } = useEncounterNotes();

  const cleanupSession = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    // removes items from cache but doesn't trigger a re-render
    // because the login screen doesn't have any queries on it, this should be fine
    queries.removeQueries();
    resetNoteContext();
  };

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
      cleanupSession();
    },
    onTimeout: () => {
      dispatch(idleTimeout());
      cleanupSession();
    },
    refreshToken: () => api.refreshToken(),
  };
};
