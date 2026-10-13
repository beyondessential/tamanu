import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '../../contexts/Auth';

const TICK_MS = 1000;
const TOKEN_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Tracks how long the kiosk has gone without interaction while a patient's session is open.
 * After `timeoutSeconds` it reports a countdown of `warningSeconds`, and when that runs out it
 * calls `onExpire`. Interaction is reported through `recordActivity`, and is ignored once the
 * warning is showing so that only an explicit "I'm still here" keeps the session.
 */
export const useInactivityTimer = ({ isEnabled, timeoutSeconds, warningSeconds, onExpire }) => {
  const lastActivityRef = useRef(Date.now());
  const isWarningRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const [secondsIdle, setSecondsIdle] = useState(0);

  useEffect(() => {
    if (!isEnabled) return undefined;
    lastActivityRef.current = Date.now();
    isWarningRef.current = false;
    setSecondsIdle(0);

    const interval = setInterval(() => {
      const idle = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      if (idle >= timeoutSeconds + warningSeconds) {
        onExpireRef.current();
        return;
      }
      isWarningRef.current = idle >= timeoutSeconds;
      setSecondsIdle(idle);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [isEnabled, timeoutSeconds, warningSeconds]);

  const recordActivity = useCallback(() => {
    if (!isWarningRef.current) lastActivityRef.current = Date.now();
  }, []);

  const dismissWarning = useCallback(() => {
    lastActivityRef.current = Date.now();
    isWarningRef.current = false;
    setSecondsIdle(0);
  }, []);

  const isWarning = isEnabled && secondsIdle >= timeoutSeconds;
  return {
    isWarning,
    secondsRemaining: isWarning ? timeoutSeconds + warningSeconds - secondsIdle : null,
    recordActivity,
    dismissWarning,
  };
};

/** The kiosk stays open for a whole day, so it renews its sign-in rather than timing out. */
export const useKeepSignedIn = () => {
  const { refreshToken } = useAuth();
  useEffect(() => {
    const interval = setInterval(() => {
      refreshToken().catch(() => {
        // A failed refresh is retried on the next interval; the current token is still valid
      });
    }, TOKEN_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshToken]);
};
