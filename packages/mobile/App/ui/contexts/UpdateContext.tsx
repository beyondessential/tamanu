import React, { createContext, type PropsWithChildren, useContext } from 'react';

import { useAppUpdate, type AppUpdateState } from '~/ui/hooks/useAppUpdate';

/**
 * Holds the state of an outstanding app update in one place. The home screen banner and the Sync
 * tab both report it and both offer to install, so they have to be looking at the same download
 * rather than each running one of their own.
 */
const UpdateContext = createContext<AppUpdateState | null>(null);

export const UpdateProvider = ({ children }: PropsWithChildren): React.ReactElement => {
  const update = useAppUpdate();
  return <UpdateContext.Provider value={update}>{children}</UpdateContext.Provider>;
};

export const useUpdate = (): AppUpdateState => {
  const update = useContext(UpdateContext);
  if (!update) {
    throw new Error('useUpdate must be called inside an UpdateProvider');
  }
  return update;
};
