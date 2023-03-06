import config from 'config';
import { setupTracing } from '@tamanu/tracing';
import { serviceContext } from './context';

export const tracingSDK = setupTracing({
  ...config.honeycomb,
  serviceContext: serviceContext(),
});
