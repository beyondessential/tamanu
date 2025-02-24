import config from '../config';
import {create as createTimesync} from 'timesync';

export const initTimesync = async ({models, centralServer}) => {
   const ts = createTimesync({
      server: `${centralServer.host}/timesync`,
      interval: config.timesync.interval,
    });
    ts.on('change', (offset) => {
      console.log('happening')
      models.LocalSystemFact.set('timesyncOffset', offset);
    });
    return ts
  }
