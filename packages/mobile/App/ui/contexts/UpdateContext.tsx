import React, {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from 'react';

import { UpdateModals } from '~/ui/components/UpdateModals';
import { useAppUpdate, type AppUpdateState } from '~/ui/hooks/useAppUpdate';

interface UpdateContextValue extends AppUpdateState {
  /** Asks for the notification permission, then for confirmation that the app may close. */
  requestInstall: () => Promise<void>;
}

/**
 * Holds the state of an outstanding app update in one place. The home screen banner and the Sync
 * tab both report it and both offer to install, so they have to be looking at the same download
 * rather than each running one of their own. The install messages are shown from here too, once,
 * since both screens can be mounted at the same time.
 */
const UpdateContext = createContext<UpdateContextValue | null>(null);

export const UpdateProvider = ({ children }: PropsWithChildren): React.ReactElement => {
  const update = useAppUpdate();
  const { prepareInstall, install, dismissInstallFailure, stage } = update;
  const [confirming, setConfirming] = useState(false);

  const requestInstall = useCallback(async () => {
    await prepareInstall();
    setConfirming(true);
  }, [prepareInstall]);

  return (
    <UpdateContext.Provider value={{ ...update, requestInstall }}>
      {children}
      <UpdateModals
        stage={stage}
        confirming={confirming}
        onCancelConfirm={() => void setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          install();
        }}
        onTryAgain={() => void install()}
        onDismissFailure={dismissInstallFailure}
      />
    </UpdateContext.Provider>
  );
};

export const useUpdate = (): UpdateContextValue => {
  const update = useContext(UpdateContext);
  if (!update) {
    throw new Error('useUpdate must be called inside an UpdateProvider');
  }
  return update;
};
