import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { theme } from '/styled/theme';
import { BaseInputProps } from '/interfaces/BaseInputProps';

interface ReadOnlyBannerProps extends BaseInputProps {
  label: string;
  value: string[];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffed',
    height: 70,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 3,
    borderColor: theme.colors.SECONDARY_MAIN
  },
  labelText: { textAlignVertical: 'center', textAlign: 'center' },
  valueText: {
    textAlignVertical: 'center',
    textAlign: 'center',
    fontSize: 20,
    color: theme.colors.PRIMARY_MAIN
  }
});

export const ReadOnlyBanner = ({
  label,
  value
}: ReadOnlyBannerProps): JSX.Element => {
  return (
    <View style={styles.container}>
      <Text style={styles.labelText}>{label}</Text>
      <Text style={styles.valueText}>{value}</Text>
    </View>
  );
};
