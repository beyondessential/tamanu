import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '/styled/theme';
import { TranslatedTextElement } from '../Translations/TranslatedText';

interface VaccineRowHeaderProps {
  title: string;
  subtitle?: TranslatedTextElement;
}

export const VaccineRowHeader = React.memo(
  ({ title, subtitle }: VaccineRowHeaderProps): JSX.Element => (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  ),
);

const styles = StyleSheet.create({
  container: {
    width: 130,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.BOX_OUTLINE,
    backgroundColor: theme.colors.BACKGROUND_GREY,
    paddingLeft: 15,
    height: 80,
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    color: theme.colors.TEXT_SUPER_DARK,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.TEXT_MID,
  },
});
