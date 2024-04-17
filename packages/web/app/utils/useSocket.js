import io from 'socket.io-client';
import { useEffect, useState } from 'react';

export const useSocket = (props) => {
  const { uri, ...otherSettings } = props || {};
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    initSocket();
    return () => {
      socket?.disconnect();
    };
  }, [uri]);

  const initSocket = () => {
    //TODO: Use config to specify a URL to connect to the Websocket
    const serverLocation = "http://localhost:4000";
    const newSocket = io(uri || serverLocation, otherSettings)
    setSocket(newSocket);
  };

  return {
    socket,
  };
};
