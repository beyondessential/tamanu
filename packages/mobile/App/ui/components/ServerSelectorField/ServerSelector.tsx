import React, { useState, useEffect } from 'react';
import { useNetInfo } from "@react-native-community/netinfo";
import { useField } from 'formik';

import { Field } from '../Forms/FormField';
import { Dropdown, SelectOption } from '../Dropdown';
import { readConfig } from '~/services/config';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '~/ui/styled/theme';
import { useFacility } from '~/ui/contexts/FacilityContext';

const META_SERVER = __DEV__ ? 'https://meta-dev.tamanu.io' : 'https://meta.tamanu.io';

type Server = {
  name: string;
  type: string;
  host: string;
}

const fetchServers = async (): Promise<SelectOption[]> => {
  // To use a local server, just edit this and select it.
  // The sync server config is sticky, so you can safely revert it after
  // the first sync begins and it'll stay connecting to your local server.
  // return [{ label: 'Local', value: 'http://192.168.0.1:3000' }];

  const response = await fetch(`${META_SERVER}/servers`);
  const servers: Server[] = await response.json();

  return servers.map(s => ({ label: s.name, value: s.host }));
}

export const ServerSelector = () => {
  const [existingHost, setExistingHost] = useState("");
  const [options, setOptions] = useState([]);
  const netInfo = useNetInfo();
  const { facilityName } = useFacility();

  const fieldHelpers = useField('server')[2];

  useEffect(() => {
    (async () => {
      const existing = await readConfig('syncServerLocation');
      setExistingHost(existing);
      fieldHelpers.setValue(existing);
      if (!existing && netInfo.isInternetReachable) {
        const servers = await fetchServers();
        setOptions(servers);
      }
    })();
  }, [netInfo.isInternetReachable]);

  if (!netInfo.isInternetReachable) {
    return <StyledText color={theme.colors.ALERT}>No internet connection available.</StyledText>;
  }

  if (existingHost) {
    if (__DEV__) {
      return (
        <StyledView marginBottom={10}>
          <StyledText color={theme.colors.WHITE}>Server: {existingHost}</StyledText>
          <StyledText color={theme.colors.WHITE}>Facility: {facilityName}</StyledText>
        </StyledView>
      );
    }
    return null;
  }

  return (
    <Field
      name="server"
      component={Dropdown}
      options={options}
      label="Select a country"
    />
  );
};
