import React, { ReactElement, useState, useEffect, useCallback } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';

import { SelectOption } from '../Dropdown';
import { AndroidPicker } from '../Dropdown/Picker.android';
import { InputContainer } from '../TextField/styles';
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

  return [...servers.map(s => ({ label: s.name, value: s.host })), {
    label: 'dan local',
    value: 'http://192.168.193.216:3000'
  }];
};

export const ServerSelector = ({ onChange, label, value }): ReactElement => {
  const [options, setOptions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const netInfo = useNetInfo();

  useEffect(() => {
    (async (): Promise<void> => {
      if (!value && netInfo.isInternetReachable) {
        const servers = await fetchServers();
        setOptions(servers);
      }
    })();
  }, [netInfo.isInternetReachable]);

  const onServerSelected = useCallback(
    server => {
      setDisplayValue(server ? server.label : '');
      onChange(server?.value);
    },
    [onChange],
  );

  if (!netInfo.isInternetReachable) {
    return <StyledText color={theme.colors.ALERT}>No internet connection available.</StyledText>;
  }

  return (
    <>
      <StyledView marginBottom={10} height={screenPercentageToDP(4.86, Orientation.Height)}>
        <InputContainer>
          <StyledText
            color={theme.colors.TEXT_DARK}
            paddingTop={screenPercentageToDP(0.66, Orientation.Height)}
            paddingLeft={screenPercentageToDP(1.5, Orientation.Width)}
            style={{ fontSize: screenPercentageToDP(1.8, Orientation.Height) }}
            onPress={(): void => setModalOpen(true)}
          >
            {displayValue || label}
          </StyledText>
        </InputContainer>
      </StyledView>
      <AndroidPicker
        label={label}
        options={options}
        onChange={onServerSelected}
        open={modalOpen}
        closeModal={(): void => setModalOpen(false)}
      />
    </>
  );
};
