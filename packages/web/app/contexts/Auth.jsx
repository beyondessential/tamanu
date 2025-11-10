import React, { useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { AuthContext, useAuth as useAuthFromUi } from '@tamanu/ui-components';

import { idleTimeout, logout } from '../store';
import { useApi } from '../api';
import { useEncounterNotesQuery } from './EncounterNotes';
import { LOCAL_STORAGE_KEYS } from '../constants';

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const api = useApi();
  const queries = useQueryClient();
  const { resetNoteContext } = useEncounterNotesQuery();
  const navigate = useNavigate();

  const { currentUser, ability, facilityId, currentRole } = useSelector(state => ({
    currentUser: state.auth.user,
    ability: state.auth.ability,
    facilityId: state.auth.facilityId,
    currentRole: state.auth.role,
  }));

  const cleanupSession = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    queries.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== 'serverAlive' });
    resetNoteContext();
    navigate('/');
  }, [queries, resetNoteContext, navigate]);

  const onLogout = useCallback(() => {
    dispatch(logout());
    cleanupSession();
  }, [dispatch, cleanupSession]);

  const onTimeout = useCallback(() => {
    dispatch(idleTimeout());
    cleanupSession();
  }, [dispatch, cleanupSession]);

  const refreshToken = useCallback(() => api.refreshToken(), [api]);

  const value = useMemo(
    () => ({ currentUser, ability, facilityId, currentRole, onLogout, onTimeout, refreshToken }),
    [currentUser, ability, facilityId, currentRole, onLogout, onTimeout, refreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useAuthFromUi();
