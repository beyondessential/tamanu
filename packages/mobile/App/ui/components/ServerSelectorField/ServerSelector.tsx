import React, { ReactElement, useState, useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';

import { SelectOption, Dropdown } from '../Dropdown';
import { StyledText, StyledView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';

const META_SERVER = __DEV__ ? 'https://meta-dev.tamanu.io' : 'https://meta.tamanu.io';

type Server = {
  name: string;
  type: string;
  host: string;
};

const fetchServers = async (): Promise<SelectOption[]> => {
  // To use a local server, just edit this and select it.
  // The sync server config is sticky, so you can safely revert it after
  // the first sync begins and it'll stay connecting to your local server.
  // return [{ label: 'Local', value: 'http://192.168.0.1:3000' }];

  const response = await fetch(`${META_SERVER}/servers`);
  const servers: Server[] = await response.json();
  const testBranchServer = { name: 'EPI-492', host: 'https://central.epi-492-add-ability-to-configure.internal.tamanu.io' };
  const hackySolution = [...servers, testBranchServer];

  return hackySolution.map(s => ({ label: s.name, value: s.host }));
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
