import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TableHeader } from '../Table';
import { theme } from '/styled/theme';

export const vaccineTableHeader: TableHeader = {
  key: 'date',
  accessor: title => (
    <View style={styles.container}>
      <Text style={styles.text}>{title}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
    paddingBottom: 15,
    width: 85,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.MAIN_SUPER_DARK,
  },
  text: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.WHITE,
  },
});
