import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { BaseInputProps } from '/interfaces/BaseInputProps';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

interface ReadOnlyBannerProps extends BaseInputProps {
  label: string;
  value: string[];
}

const styles = StyleSheet.create({
  container: {
    height: 55,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 5,
    borderColor: theme.colors.PRIMARY_MAIN,
  },
  labelText: { color: theme.colors.PRIMARY_MAIN, fontSize: 14, fontWeight: '500', marginBottom: 2 },
  valueText: {
    textAlignVertical: 'center',
    textAlign: 'center',
    fontSize: 24,
    color: theme.colors.PRIMARY_MAIN,
    fontWeight: '500',
  },
});

export const ReadOnlyBanner = ({ label, value }: ReadOnlyBannerProps): JSX.Element => (
  <StyledView marginBottom={screenPercentageToDP('2.24', Orientation.Height)}>
    <Text style={styles.labelText}>{label}</Text>
    <View style={styles.container}>
      <Text style={styles.valueText}>{value}</Text>
    </View>
  </StyledView>
);
