import React, { ReactElement, useState, useEffect } from 'react';

import { Field } from '../FormField';
import { Dropdown, SelectOption } from '../../Dropdown';
import { readConfig } from '~/services/config';
import { StyledText } from '/styled/common';

const META_SERVER = 'https://meta-dev.tamanu.io';
// TODO: change once prod meta server is deployed
// const META_SERVER = __DEV__ ? 'https://meta-dev.tamanu.io' : 'https://meta.tamanu.io';

const fetchServers = async (): Promise<SelectOption[]> => {
  // To use a local server, just edit this and select it.
  // The sync server config is sticky, so you can safely revert it after
  // the first sync begins and it'll stay connecting to your local server.
  // return [{ label: 'Local', value: 'http://192.168.0.1:3000' }];

  const response = await fetch(`${META_SERVER}/servers`);
  const servers = await response.json();

  return servers.map(s => ({ label: s.name, value: s.host }));
}

export const ServerSelector = () => {
  const [existingHost, setExistingHost] = useState("");
  const [options, setOptions] = useState([]);

  useEffect(() => {
    (async () => {
      const existing = await readConfig('syncServerLocation');
      setExistingHost(existing);
      if(!existing) {
        const servers = await fetchServers();
        setOptions(servers);
      }
    })();
  }, []);

  if(existingHost) {
    if (__DEV__) {
      return <StyledText>{existingHost}</StyledText>;
    }
    return null;
  }

  return (
    <Field
      name="server"
      component={Dropdown}
      options={options}
      label="Country"
    />
  );
};
