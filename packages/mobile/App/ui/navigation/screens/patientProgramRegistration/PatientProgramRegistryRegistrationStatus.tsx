import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PROGRAM_REGISTRATION_STATUS_LABELS } from '~/constants/programRegistries';
import { TranslatedEnum } from '~/ui/components/Translations/TranslatedEnum';
import { theme } from '~/ui/styled/theme';

export const PatientProgramRegistryRegistrationStatus = ({ registrationStatus }) => (
  <View style={styles.container}>
    <View
      style={[
        styles.dot,
        {
          backgroundColor:
            registrationStatus === 'active' ? theme.colors.SAFE : theme.colors.TEXT_SOFT,
        },
      ]}
    />
    <Text style={styles.text}>
      <TranslatedEnum
        value={registrationStatus}
        enumValues={PROGRAM_REGISTRATION_STATUS_LABELS}
      />
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  dot: {
    borderRadius: 100,
    height: 7,
    width: 7,
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.TEXT_DARK,
  },
});
