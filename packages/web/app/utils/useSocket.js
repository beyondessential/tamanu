import io from 'socket.io-client';
import { useEffect, useState } from 'react';
import { WS_PATH } from '@tamanu/constants';
import { keepSocketConnected } from '@tamanu/utils/keepSocketConnected';

import { useApi } from '../api';

// The websocket is tab-wide external state: one connection is shared by every
// consumer of this hook, rather than one per component instance. It is opened
// lazily on first use and closed again once the last consumer unmounts, so a tab
// with nothing listening doesn't hold a connection open.
let sharedSocket = null;
let stopReconnectingSharedSocket = null;
let consumerCount = 0;

// Counting the consumer here, as part of handing it the socket, rather than in its
// effect, keeps the count from lagging behind reality: React runs an unmounting
// consumer's cleanup before a mounting consumer's effects, so a consumer that has
// rendered but not yet mounted has to count already — otherwise that cleanup can
// disconnect the very socket the new consumer was handed to listen on.
const acquireSharedSocket = api => {
  consumerCount += 1;
  if (sharedSocket) return sharedSocket;

  sharedSocket = io('', {
    path: WS_PATH,
    transports: ['websocket'],
    // The central server only accepts connections that carry an access token. Read on every
    // attempt, so a reconnection carries the token as the app last refreshed it.
    auth: sendToken => sendToken({ token: api.getToken() }),
  });
  stopReconnectingSharedSocket = keepSocketConnected(sharedSocket);
  return sharedSocket;
};

const releaseSharedSocket = () => {
  if (consumerCount === 0) {
    // An unpaired release, which is a bug in this module or in a consumer: report
    // it rather than absorb it, because a count that has drifted out of step with
    // the consumers disconnects a socket they are still listening on.
    console.error('useSocket: the shared socket was released more times than it was acquired');
  }

  consumerCount = Math.max(consumerCount - 1, 0);
  if (consumerCount > 0) return;

  stopReconnectingSharedSocket?.();
  stopReconnectingSharedSocket = null;
  sharedSocket?.disconnect();
  sharedSocket = null;
};

// The hook pairs its acquisition with exactly one release, so the unpaired release
// above can't be reached through it; exported so the tests can cover that path.
export const releaseSharedSocketForTestsOnly = releaseSharedSocket;

export const useSocket = () => {
  // Acquired during render, so that consumers have a socket to attach listeners to
  // in their own first effect, and so that this consumer counts before any other
  // consumer's unmount cleanup runs.
  const api = useApi();
  const [socket] = useState(() => acquireSharedSocket(api));

  useEffect(() => {
    // Nothing to do on mount: the socket was acquired during render, and stays
    // connected for as long as this consumer holds its count.
    return releaseSharedSocket;
  }, []);

  return {
    socket,
  };
};
