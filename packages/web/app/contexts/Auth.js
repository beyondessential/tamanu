import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { idleTimeout, logout } from '../store';
import { useApi } from '../api';
import { useEncounterNotesQuery } from './EncounterNotes';
import { LOCAL_STORAGE_KEYS } from '../constants';
// This is just a redux selector for now.
// This should become its own proper context once the auth stuff
// is refactored out of redux.

export const useAuth = () => {
  const dispatch = useDispatch();
  const api = useApi();
  const queries = useQueryClient();
  const { resetNoteContext } = useEncounterNotesQuery();
  const navigate = useNavigate();

  const cleanupSession = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    // removes items from cache but doesn't trigger a re-render
    // because the login screen doesn't have any queries on it, this should be fine
    // Excluding serverAlive query which only should fire on first load
    queries.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== 'serverAlive' });
    resetNoteContext();
    navigate('/');
  };

  return {
    ...useSelector(state => ({
      currentUser: state.auth.user,
      ability: state.auth.ability,
      facilityId: state.auth.facilityId,
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
