import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

const App = () => {
  return (
    <View style={styles.center}>
      <Text>Tamanu app</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
