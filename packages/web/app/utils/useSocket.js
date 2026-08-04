import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import { WS_PATH } from '@tamanu/constants';

// The websocket is tab-wide external state: one connection is shared by every
// consumer of this hook, rather than one per component instance. It is opened
// lazily on first use and closed again once the last consumer unmounts, so a tab
// with nothing listening doesn't hold a connection open.
let sharedSocket = null;
let consumerCount = 0;

const openSharedSocket = () =>
  (sharedSocket ??= io('', {
    path: WS_PATH,
    transports: ['websocket'],
  }));

const releaseSharedSocket = () => {
  consumerCount -= 1;
  if (consumerCount > 0) return;

  sharedSocket?.disconnect();
  sharedSocket = null;
};

export const useSocket = () => {
  // Opened during render so consumers have a socket to attach listeners to in
  // their own first effect, and reference-counted in the effect below so that it
  // is only ever disconnected by the last consumer to unmount.
  const [socket, setSocket] = useState(openSharedSocket);

  useEffect(() => {
    consumerCount += 1;
    // Reopen if the connection acquired during render was since closed by the
    // last consumer unmounting (React may remount a component that keeps its
    // state, e.g. under StrictMode or when an offscreen tree is revealed again).
    // Handing back the same socket bails out of the re-render.
    setSocket(openSharedSocket());
    return releaseSharedSocket;
  }, []);

  return {
    socket,
  };
};
