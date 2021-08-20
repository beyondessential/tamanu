import config from 'config';
import {
  TupaiaApiClient,
  BasicAuthHandler,
  LOCALHOST_ENDPOINT_BASE_URLS,
} from '@beyondessential/tupaia-api-client';

export const createTupaiaApiClient = () => {
  if (!config.tupaiaApiClient?.auth) {
    throw new Error('Must specify tupaiaApiClient.auth in config');
  }

  const { username, password } = config.tupaiaApiClient.auth;

  const auth = new BasicAuthHandler(username, password);

  // Can set config option { baseUrls: local } to use local host tupaia. Otherwise uses production.
  const endpointBaseUrls =
    config.tupaiaApiClient.baseUrls === 'local' ? LOCALHOST_ENDPOINT_BASE_URLS : undefined;

  return new TupaiaApiClient(auth, endpointBaseUrls);
};
