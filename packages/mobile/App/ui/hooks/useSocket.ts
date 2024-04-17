import io, { ManagerOptions, SocketOptions } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { readConfig } from '~/services/config';

interface Props extends Partial<ManagerOptions & SocketOptions> {
  uri?: string;
}

export const useSocket = (props: Props = {}) => {
  const { uri, ...others } = props;
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    initSocket();
    return () => {
      socket?.disconnect();
    };
  }, [uri]);

  const initSocket = async () => {
    const syncServerLocation = await readConfig('syncServerLocation');
    const newSocket = io(uri || syncServerLocation, others)
    setSocket(newSocket);
  };

  return {
    socket,
  };
};
