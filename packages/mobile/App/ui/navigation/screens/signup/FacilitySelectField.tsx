import React, { useState, ReactElement } from 'react';
import { StyledText, StyledView } from '/styled/common';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';

import { theme } from '~/ui/styled/theme';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { TextField } from '~/ui/components/TextField/TextField';

const FacilityItem = ({ label, selected, onPress }): ReactElement => (
  <TouchableOpacity onPress={onPress}>
    <StyledView
      paddingRight={screenPercentageToDP(2.43, Orientation.Width)}
      paddingLeft={screenPercentageToDP(2.43, Orientation.Width)}
      paddingTop={screenPercentageToDP(3.43, Orientation.Width)}
      paddingBottom={screenPercentageToDP(3.43, Orientation.Width)}
      background={selected ? theme.colors.LIGHT_BLUE : theme.colors.WHITE}
    >
      <StyledText color={theme.colors.TEXT_DARK}>{label}</StyledText>
    </StyledView>
  </TouchableOpacity>
);

const LoadingIndicator = (): ReactElement => (
  <StyledView padding={10}>
    <StyledText color={theme.colors.TEXT_DARK}>Loading facilities...</StyledText>
  </StyledView>
);

const NoFacilitiesIndicator = (): ReactElement => (
  <StyledView padding={10}>
    <StyledText color={theme.colors.TEXT_DARK}>No facilities found.</StyledText>
  </StyledView>
);

export const FacilitySelectField = ({ options, onChange, value }): ReactElement => {
  const [currentFilter, setCurrentFilter] = useState('');

  const items = options
    .filter((o) => {
      const lowercase = (o.label || '').toLowerCase();
      return lowercase.includes((currentFilter || '').toLowerCase());
    })
    .map((o) => (
      <FacilityItem
        key={o.value}
        label={o.label}
        onPress={(): void => onChange(o.value)}
        selected={value === o.value}
      />
    ));

  const contents = ((): ReactElement => {
    if (items.length > 0) return items;
    if (options.length === 0) return <LoadingIndicator />;
    return <NoFacilitiesIndicator />;
  })();

  return (
    <StyledView height={screenPercentageToDP(34.7, Orientation.Height)}>
      <StyledView marginBottom={screenPercentageToDP(1, Orientation.Height)}>
        <TextField
          label="Filter facilities"
          value={currentFilter}
          onChange={setCurrentFilter}
          labelColor={theme.colors.WHITE}
        />
      </StyledView>
      <ScrollView showsVerticalScrollIndicator>
        <StyledView minHeight={screenPercentageToDP(25, Orientation.Height)} background="#fff">
          {contents}
        </StyledView>
      </ScrollView>
    </StyledView>
  );
};
