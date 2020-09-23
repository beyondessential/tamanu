import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
    margin: 2,
    borderColor: '#2a4944',
    borderWidth: 1,
    backgroundColor: '#d2f7f1',
  },
  title: {
    fontSize: 32,
  },
});

/**
 * Takes array of JSON/POJO objects and displays them in a in field format.
 * Useful for debugging response data etc.
 */
export const DataDebugView = (data: any): JSX.Element => (
  <View>
    {Object.entries(data).map(([name, value]) => (
      <Text
        style={styles.item}
      >
        {`${name}: ${value}`}
      </Text>
    ))}
  </View>
);
