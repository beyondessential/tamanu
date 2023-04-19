import { createSelector } from 'reselect';
import { ReduxStoreProps } from '../interfaces/ReduxStoreProps';

export const authSelector = createSelector(
  (state: ReduxStoreProps) => state.auth,
  auth => auth,
);

export const authUserSelector = createSelector(
  (state: ReduxStoreProps) => state.auth.user,
  user => user,
);

export const authSignedInSelector = createSelector(
  (state: ReduxStoreProps) => state.auth.signedIn,
  signedIn => signedIn,
);
