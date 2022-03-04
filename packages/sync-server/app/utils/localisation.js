import config from 'config';
import { get } from 'lodash';

export const getLocalisationData = key => {
  const { localisation } = config;
  return get(localisation.data, key);
};
