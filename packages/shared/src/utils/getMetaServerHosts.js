import config from 'config';

export const getMetaServerHosts = () => {
  const metaServerHosts = config?.metaServer?.hosts ?? [config?.metaServer?.host];
  if (!Array.isArray(metaServerHosts)) {
    throw new Error('metaServer.hosts is not an array');
  }
  if (metaServerHosts.length === 0) {
    throw new Error('No meta server hosts configured');
  }
  return metaServerHosts;
};
