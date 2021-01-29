import React, { ReactElement, useState, useEffect } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { Field } from '../FormField';
import { Button } from '../../Button';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { TextField } from '../../TextField/TextField';
import { Dropdown } from '../../Dropdown';

import { readConfig } from '~/services/config';

type SignInFieldsProps = {
  handleSubmit: (value: any) => void;
  isSubmitting: boolean;
};

const fetchServers = async () => {
  /* TODO
  const response = await fetch('https://meta.tamanu.io/v1/servers');
  const servers = await response.json();
   */
  await new Promise(resolve => setTimeout(resolve, 1000));
  const servers = [
    { name: 'Local', type: 'dev', host: 'http://192.168.1.105:3000', },
    { name: 'Dev', type: 'dev', host: 'https://dev-sync.tamanu.io', },
    { name: 'Demo', type: 'dev', host: 'https://demo-sync.tamanu.io', },
    { name: 'Fiji', type: 'live', host: 'https://fiji.tamanu.io', },
    { name: 'Tonga', type: 'live', host: 'https://tonga.tamanu.io', },
    { name: 'Samoa', type: 'live', host: 'https://samoa.tamanu.io', },
  ];

  return servers.map(s => ({ label: s.name, value: s.host }));
}

const ServerSelector = ({ ...props }) => {
  const [existingHost, setExistingHost] = useState("loading");
  const [options, setOptions] = useState([]);

  useEffect(() => {
    (async () => {
      const existing = await readConfig('syncServerLocation');
      setExistingHost(existing);
      const servers = await fetchServers();
      setOptions(servers);
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

export const SignInFields = ({
  handleSubmit,
  isSubmitting,
}: SignInFieldsProps): ReactElement => (
  <StyledView
    marginTop={screenPercentageToDP(14.7, Orientation.Height)}
    marginRight={screenPercentageToDP(2.43, Orientation.Width)}
    marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
  >
    <StyledText
      fontSize={13}
      marginBottom={5}
      color={theme.colors.SECONDARY_MAIN}
    >
      ACCOUNT DETAILS
    </StyledText>
    <StyledView
      justifyContent="space-around"
    >
      <ServerSelector />
      <Field
        name="email"
        keyboardType="email-address"
        component={TextField}
        label="Email"
      />
      <Field
        name="password"
        component={TextField} 
        label="Password" 
        secure 
      />
    </StyledView>
    <Button
      marginTop={20}
      backgroundColor={theme.colors.SECONDARY_MAIN}
      onPress={handleSubmit}
      loadingAction={isSubmitting}
      textColor={theme.colors.TEXT_SUPER_DARK}
      fontSize={screenPercentageToDP('1.94', Orientation.Height)}
      fontWeight={500}
      buttonText="Sign in"
    />
  </StyledView>
);
