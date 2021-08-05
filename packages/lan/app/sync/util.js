import { WebRemote } from './WebRemote';

export const getSyncServerConfig = async () => {
  const remote = new WebRemote();
  await remote.connect();
  const response = await remote.config();
  return response.config;
};