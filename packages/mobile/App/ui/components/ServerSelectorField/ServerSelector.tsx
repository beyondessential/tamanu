import React, { ReactElement, useState, useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';

import { SelectOption, Dropdown } from '../Dropdown';
import { StyledText, StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';
import * as overrides from '/root/serverOverrides.json';

type Server = {
  name: string;
  type: string;
  host: string;
};

const fetchServers = async (): Promise<SelectOption[]> => {
  // To use a local server, just edit this and select it.
  // The sync server config is sticky, so you can safely revert it after
  // the first sync begins and it'll stay connecting to your local server.
  return [{ label: 'Local', value: 'http://10.0.2.2:3000' }];

  // allows overriding the central server list or meta server in builds
  const { metaServer: metaServerOverride, centralServers: centralServerOverrides } = overrides;
  if (centralServerOverrides) {
    return centralServerOverrides;
  }

  const defaultMetaServer = __DEV__ ? 'https://meta-dev.tamanu.io' : 'https://meta.tamanu.io';
  const metaServer = metaServerOverride || defaultMetaServer;
  const response = await fetch(`${metaServer}/servers`);
  const servers: Server[] = await response.json();

  return servers.map(s => ({
    label: s.name,
    value: s.host,
  }));
};

export const ServerSelector = ({ onChange, label, value, error }): ReactElement => {
  const [options, setOptions] = useState([]);
  const netInfo = useNetInfo();

  useEffect(() => {
    (async (): Promise<void> => {
      if (!value && netInfo.isInternetReachable) {
        const servers = await fetchServers();
        setOptions(servers);
      }
    })();
  }, [netInfo.isInternetReachable]);

  if (!netInfo.isInternetReachable) {
    return <StyledText color={theme.colors.ALERT}>No internet connection available.</StyledText>;
  }

  return (
    <StyledView
      marginBottom={screenPercentageToDP(7, Orientation.Height)}
      height={screenPercentageToDP(5.46, Orientation.Height)}
    >
      <Dropdown
        value={value}
        options={options}
        onChange={onChange}
        label={label}
        fixedHeight
        selectPlaceholderText="Select"
        labelColor="white"
        error={error}
      />
    </StyledView>
  );
};
